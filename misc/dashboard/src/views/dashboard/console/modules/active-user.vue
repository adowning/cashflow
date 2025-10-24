<template>
  <div class="card art-custom-card">
    <ArtBarChart
      class="chart"
      barWidth="50%"
      height="13.7rem"
      :showAxisLine="false"
      :data="[160, 100, 150, 80, 190, 100, 175, 120, 160]"
      :xAxisData="['1', '2', '3', '4', '5', '6', '7', '8', '9']"
    />
    <div class="text">
      <h3 class="box-title">User overview</h3>
      <p class="subtitle">than last week <span class="text-success">+23%</span></p>
      <p class="subtitle">We've created multiple options for you to combine and customize into a pixel-perfect page</p>
    </div>
    <div class="list">
      <div v-for="(item, index) in list" :key="index">
        <p>{{ item.num }}</p>
        <p class="subtitle">{{ item.name }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface UserStatItem {
    name: string
    num: string
  }

  /**
   * 用户统计数据列表
   * 包含总用户量、总访问量、日访问量和周同比等关键指标
   */
  const list: UserStatItem[] = [
    { name: 'total users', num: '32k' },
    { name: 'total visits', num: '128k' },
    { name: 'Daily visits', num: '1.2k' },
    { name: 'Weekly year-on-year', num: '+5%' }
  ]
</script>

<style lang="scss" scoped>
  .card {
    box-sizing: border-box;
    width: 100%;
    height: 420px;
    padding: 16px;

    .chart {
      box-sizing: border-box;
      width: 100%;
      height: 220px;
      padding: 10px;
      border-radius: calc(var(--custom-radius) / 2 + 4px) !important;
    }

    .text {
      margin-left: 3px;

      h3 {
        margin-top: 20px;
        font-size: 18px;
        font-weight: 500;
      }

      p {
        margin-top: 5px;
        font-size: 14px;

        &:last-of-type {
          height: 42px;
          margin-top: 5px;
        }
      }
    }

    .list {
      display: flex;
      justify-content: space-between;
      margin-left: 3px;

      > div {
        flex: 1;

        p {
          font-weight: 400;

          &:first-of-type {
            font-size: 24px;
            color: var(--art-gray-900);
          }

          &:last-of-type {
            font-size: 13px;
          }
        }
      }
    }
  }

  .dark {
    .card {
      .chart {
        background: none;
      }
    }
  }

  @media screen and (max-width: $device-phone) {
    .dark {
      .card {
        .chart {
          padding: 15px 0 0 !important;
        }
      }
    }
  }
</style>
