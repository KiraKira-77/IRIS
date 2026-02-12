<template>
  <div class="page-container iris-page">
    <div class="iris-card page-content">
      <div class="page-header">
        <div class="left">
          <el-button link :icon="Back" @click="$router.back()">返回项目</el-button>
          <h2 class="page-title" style="display: inline-block; margin-left: 12px">
            任务详情: T-002
          </h2>
        </div>
        <div class="right">
          <el-tag type="warning" effect="dark" size="large">评审中</el-tag>
        </div>
      </div>

      <el-row :gutter="24">
        <!-- 左侧：任务信息 -->
        <el-col :span="16">
          <div class="section-block">
            <h3 class="section-title">检查要求</h3>
            <div class="info-item">
              <label>检查内容:</label>
              <p>核对核心系统管理员账号操作日志，重点关注非工作时间的特权操作。</p>
            </div>
            <div class="info-item">
              <label>检查依据:</label>
              <p>《信息系统安全等级保护基本要求》 7.1.3 安全审计</p>
            </div>
            <div class="info-item">
              <label>检查方法:</label>
              <p>抽样检查最近3个月的堡垒机日志。</p>
            </div>
          </div>

          <el-divider />

          <div class="section-block">
            <h3 class="section-title">任务办理</h3>
            <el-form label-position="top">
              <el-form-item label="核查结论">
                <el-input type="textarea" :rows="3" placeholder="请输入核查情况..." />
              </el-form-item>
              <el-form-item label="证明材料">
                <el-upload
                  class="upload-demo"
                  drag
                  action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
                  multiple
                >
                  <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                  <div class="el-upload__text">将文件拖到此处，或 <em>点击上传</em></div>
                </el-upload>
              </el-form-item>
            </el-form>
          </div>
        </el-col>

        <!-- 右侧：操作面板 -->
        <el-col :span="8">
          <div class="action-panel">
            <h3 class="panel-title">流程操作</h3>
            <div class="panel-content">
              <el-timeline>
                <el-timeline-item timestamp="2026-02-12 10:00" placement="top" type="primary">
                  <div class="timeline-card">
                    <h4>提交任务</h4>
                    <p>李四 提交了核查材料</p>
                  </div>
                </el-timeline-item>
                <el-timeline-item timestamp="2026-02-10 14:30" placement="top">
                  <div class="timeline-card">
                    <h4>上传资料</h4>
                    <p>李四 上传了 "日志审计表.xlsx"</p>
                  </div>
                </el-timeline-item>
                <el-timeline-item timestamp="2026-02-08 09:00" placement="top">
                  <div class="timeline-card">
                    <h4>任务分发</h4>
                    <p>项目经理 分发任务给 李四</p>
                  </div>
                </el-timeline-item>
              </el-timeline>

              <div class="actions-wrapper">
                <el-button type="success" style="width: 100%">评审通过</el-button>
                <div style="margin-top: 12px; display: flex; gap: 12px">
                  <el-button type="danger" plain style="flex: 1">退回修改</el-button>
                  <el-button type="warning" plain style="flex: 1">发起整改</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Back, UploadFilled } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid $iris-border-light;
  padding-bottom: 16px;
  .page-title {
    font-size: 18px;
    font-weight: 600;
    color: $iris-text-primary;
    vertical-align: middle;
  }
}

.section-block {
  margin-bottom: 24px;
  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: $iris-text-primary;
    margin-bottom: 16px;
    border-left: 4px solid $iris-primary;
    padding-left: 12px;
  }
  .info-item {
    margin-bottom: 12px;
    label {
      font-weight: 500;
      color: $iris-text-primary;
      margin-right: 8px;
    }
    p {
      display: inline;
      color: $iris-text-secondary;
    }
  }
}

.action-panel {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid $iris-border-light;

  .panel-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 20px;
  }

  .timeline-card {
    background: #fff;
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid $iris-border-light;
    h4 {
      font-size: 14px;
      margin-bottom: 4px;
    }
    p {
      font-size: 12px;
      color: $iris-text-muted;
    }
  }

  .actions-wrapper {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid $iris-border-light;
  }
}
</style>
