<template>
  <div class="card art-custom-card">
    <div class="card-header">
      <div class="title">
        <h4 class="box-title">new user</h4>
        <p class="subtitle">growth this month<span class="text-success">+20%</span></p>
      </div>
      <ElRadioGroup v-model="radio2">
        <ElRadioButton value="this month" label="this month"></ElRadioButton>
        <ElRadioButton value="last month" label="last month"></ElRadioButton>
        <ElRadioButton value="This year" label="This year"></ElRadioButton>
      </ElRadioGroup>
    </div>
    <ArtTable
      class="table"
      :data="tableData"
      style="width: 100%"
      size="large"
      :border="false"
      :stripe="false"
      :header-cell-style="{ background: 'transparent' }"
    >
      <template #default>
        <ElTableColumn label="avatar" prop="avatar" width="150px">
          <template #default="scope">
            <div style="display: flex; align-items: center">
              <img class="avatar" :src="scope.row.avatar" alt="avatar" />
              <span class="user-name">{{ scope.row.username }}</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="area" prop="province" />
        <ElTableColumn label="gender" prop="avatar">
          <template #default="scope">
            <div style="display: flex; align-items: center">
              <span style="margin-left: 10px">{{ scope.row.sex === 1 ? 'male' : 'female' }}</span>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="schedule" width="240">
          <template #default="scope">
            <ElProgress
              :percentage="scope.row.pro"
              :color="scope.row.color"
              :stroke-width="4"
              :aria-label="`${scope.row.username}completion progress: ${scope.row.pro}%`"
            />
          </template>
        </ElTableColumn>
      </template>
    </ArtTable>
  </div>
</template>

<script setup lang="ts">
  import avatar1 from '@/assets/img/avatar/avatar1.webp'
  import avatar2 from '@/assets/img/avatar/avatar2.webp'
  import avatar3 from '@/assets/img/avatar/avatar3.webp'
  import avatar4 from '@/assets/img/avatar/avatar4.webp'
  import avatar5 from '@/assets/img/avatar/avatar5.webp'
  import avatar6 from '@/assets/img/avatar/avatar6.webp'

  interface UserTableItem {
    username: string
    province: string
    sex: 0 | 1
    age: number
    percentage: number
    pro: number
    color: string
    avatar: string
  }

  const ANIMATION_DELAY = 100

  const radio2 = ref('this month')

  /**
   * 新用户表格数据
   * 包含用户基本信息和完成进度
   */
  const tableData = reactive<UserTableItem[]>([
    {
      username: 'Small and medium fish',
      province: 'Beijing',
      sex: 0,
      age: 22,
      percentage: 60,
      pro: 0,
      color: 'rgb(var(--art-primary)) !important',
      avatar: avatar1
    },
    {
      username: 'He Xiaohe',
      province: 'Shenzhen',
      sex: 1,
      age: 21,
      percentage: 20,
      pro: 0,
      color: 'rgb(var(--art-secondary)) !important',
      avatar: avatar2
    },
    {
      username: 'Zhen Zhen Hui',
      province: 'Shanghai',
      sex: 1,
      age: 23,
      percentage: 60,
      pro: 0,
      color: 'rgb(var(--art-warning)) !important',
      avatar: avatar3
    },
    {
      username: 'Daze grass',
      province: 'Changsha',
      sex: 0,
      age: 28,
      percentage: 50,
      pro: 0,
      color: 'rgb(var(--art-info)) !important',
      avatar: avatar4
    },
    {
      username: 'cone',
      province: 'Zhejiang',
      sex: 1,
      age: 26,
      percentage: 70,
      pro: 0,
      color: 'rgb(var(--art-error)) !important',
      avatar: avatar5
    },
    {
      username: 'Leng Yue is dumbfounded',
      province: 'hubei',
      sex: 1,
      age: 25,
      percentage: 90,
      pro: 0,
      color: 'rgb(var(--art-success)) !important',
      avatar: avatar6
    }
  ])

  /**
   * 添加进度条动画效果
   * 延迟后将进度值从 0 更新到目标百分比，触发动画
   */
  const addAnimation = (): void => {
    setTimeout(() => {
      tableData.forEach((item) => {
        item.pro = item.percentage
      })
    }, ANIMATION_DELAY)
  }

  onMounted(() => {
    addAnimation()
  })
</script>

<style lang="scss">
  .card {
    // 进度动画
    .el-progress-bar__inner {
      transition: all 1s !important;
    }

    .el-radio-button__original-radio:checked + .el-radio-button__inner {
      color: var(--el-color-primary) !important;
      background: transparent !important;
    }
  }
</style>

<style lang="scss" scoped>
  .card {
    width: 100%;
    height: 510px;
    overflow: hidden;

    .card-header {
      padding-left: 25px !important;
    }

    :deep(.el-table__body tr:last-child td) {
      border-bottom: none !important;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 6px;
    }

    .user-name {
      margin-left: 10px;
    }
  }
</style>
