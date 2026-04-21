---
name: jwdeploy-auto-deploy
description: "Automate deployment operations in JWDeploy (中来自动化集成部署系统). Use when: (1) user wants to deploy a project to a specific environment, (2) user needs to build a branch and deploy it, (3) user asks for deployment status check, (4) any JWDeploy-related deployment tasks. Accepts dynamic parameters: project name (e.g., jolywood-it, jecloud-document), branch name (e.g., qas, dev, pro, master), environment (e.g., qas, pro). Extract these parameters from user input and use them throughout the workflow."
---

# JWDeploy Auto Deploy Skill

Automate deployment operations in JWDeploy (中来自动化集成部署系统).

## When to Use

✅ **USE this skill when:**
- "Deploy jolywood-it to qas"
- "Build and deploy qas branch"
- "Check deployment status"
- "Deploy the latest version"
- Any JWDeploy deployment tasks

❌ **DON'T use this skill when:**
- The user wants to modify system configurations
- The user wants to create new environments
- The user wants to delete branches or versions

## Prerequisites

- OpenClaw browser must be connected to JWDeploy
- User must be logged in to JWDeploy
- Target project and branch must exist

## Dynamic Parameters

Extract these parameters from user input:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `PROJECT` | Project name | `jolywood-it`, `jecloud-document`, `my-project` |
| `BRANCH` | Branch name | `qas`, `dev`, `pro`, `master`, `feature-xxx` |
| `ENVIRONMENT` | Target environment | `qas`, `pro` |

**Parameter Extraction Rules:**
1. If user says "deploy X to Y", then PROJECT=X, ENVIRONMENT=Y
2. If user mentions "X branch", then BRANCH=X
3. If ENVIRONMENT is not specified, default to same as BRANCH (e.g., qas branch → qas environment)
4. If only project is mentioned, ask user for branch and environment

## Deployment Workflow

### Standard Deployment Flow

```
分支管理 → 构建版本 → 版本列表(等待构建完成) → 环境管理 → 部署 → 确认部署 → 部署历史
```

### Step 1: Navigate to Branch Management

```javascript
// Navigate to branch list
browser navigate "http://10.8.8.83:8100/index.html#/page/branch/list.html"
```

### Step 2: Select Project

If project is not already selected:
- Click project dropdown
- Select target project using dynamic `PROJECT` parameter

```javascript
// Select project from dropdown
const projectName = "{{PROJECT}}"; // Dynamic parameter
// Click dropdown and select project
const dropdown = document.querySelector('.layui-form-select');
if (dropdown) {
  dropdown.click();
  // Wait for options and select matching project
  const options = document.querySelectorAll('.layui-form-select dd');
  for (let opt of options) {
    if (opt.textContent.includes(projectName)) {
      opt.click();
      break;
    }
  }
}
```

### Step 3: Build Branch

Find target branch using dynamic `BRANCH` parameter and click "构建版本":

```javascript
// Click build version for specific branch
const targetBranch = "{{BRANCH}}"; // Dynamic parameter
const rows = document.querySelectorAll('tr');
for (let row of rows) {
  const branchName = row.querySelector('td')?.textContent?.trim();
  if (branchName === targetBranch) {
    const buildLink = row.querySelector('a[lay-event="buildVersion"]');
    if (buildLink) {
      buildLink.dispatchEvent(new Event('click', { bubbles: true }));
    }
  }
}
```

### Step 4: Check Build Status

Navigate to version list and wait for build completion:

```javascript
// Navigate to version list
browser navigate "http://10.8.8.83:8100/index.html#/page/deployment_version/list.html"
```

Build statuses:
- 🟡 **构建中** - Wait for completion
- ✅ **构建成功** - Ready to deploy
- ❌ **构建失败** - Need to rebuild

### Step 5: Deploy to Environment

Navigate to environment management:

```javascript
// Navigate to environment list
browser navigate "http://10.8.8.83:8100/index.html#/page/env/list.html"
```

Find target environment using dynamic `ENVIRONMENT` parameter and click "部署":

```javascript
// Click deploy for specific environment
const targetEnv = "{{ENVIRONMENT}}"; // Dynamic parameter
const rows = document.querySelectorAll('tr');
for (let row of rows) {
  const envId = row.querySelector('td:nth-child(3)')?.textContent?.trim();
  if (envId === targetEnv) {
    const deployLink = row.querySelector('a');
    if (deployLink) {
      deployLink.dispatchEvent(new Event('click', { bubbles: true }));
    }
  }
}
```

### Step 6: Confirm Deployment

In the deployment dialog:
- Verify version is correct (should be latest qas branch version)
- Click "确认部署" button in iframe

```javascript
// Click confirm deployment button in iframe
const iframes = document.querySelectorAll('iframe');
for (let iframe of iframes) {
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      const btn = iframeDoc.querySelector('button, .layui-btn');
      if (btn && btn.textContent.includes('确认')) {
        btn.click();
      }
    }
  } catch (e) {
    // Cross-origin restriction
  }
}
```

### Step 7: Verify Deployment

Check deployment history:

```javascript
// Navigate to deployment history
browser navigate "http://10.8.8.83:8100/index.html#/page/deployment_history/list.html"
```

Or check environment list for updated version.

## Common Projects and Environments

### Projects (Examples)
- `jolywood-it` - Jolywood IT project
- `jecloud-document` - JECloud document project
- `jecloud-gateway` - JECloud gateway project
- `my-project` - User's custom project

### Environments (Examples)
- `qas` - Test environment (测试环境)
- `pro` - Production environment (生产环境)
- `dev` - Development environment
- `staging` - Staging environment

**Note:** These are examples only. The skill supports ANY project and branch names dynamically.

## Important Notes

1. **Always confirm before deploying to production (pro)**
2. **Check build status before deployment** - Only deploy successful builds
3. **Verify version in deployment dialog** - Ensure it's the correct branch
4. **Don't modify configurations** - Only perform deployment operations
5. **Wait for build completion** - Building takes time, check version list for status

## Troubleshooting

### Build Fails
- Check error logs in version list
- Rebuild the branch
- Contact developer if persistent

### Deployment Dialog Issues
- Use iframe access to click buttons
- Try JavaScript evaluation for complex interactions

### Version Not Showing
- Wait for build to complete
- Refresh version list page
- Check if build was successful

## Example Commands

```bash
# Deploy with explicit project, branch and environment
"Deploy jolywood-it qas branch to qas environment"
"Deploy project my-app dev branch to dev environment"
"Build and deploy feature-123 branch of my-project to qas"

# Deploy with implicit environment (branch = environment)
"Deploy jolywood-it qas"
"Build and deploy dev branch of my-project"

# Check status
"Check deployment status for jolywood-it"
"Show build status of my-project"

# Complex scenarios
"Deploy the latest version of project-x to pro"
"Rebuild and deploy master branch of backend-api to staging"
```

## Dynamic Parameter Examples

| User Input | PROJECT | BRANCH | ENVIRONMENT |
|------------|---------|--------|-------------|
| "Deploy jolywood-it qas to qas" | jolywood-it | qas | qas |
| "Deploy my-project dev" | my-project | dev | dev |
| "Build feature-abc branch of app-x to test" | app-x | feature-abc | test |
| "Deploy backend master to pro" | backend | master | pro |
| "Rebuild and deploy api-gateway hotfix-123 to qas" | api-gateway | hotfix-123 | qas |
