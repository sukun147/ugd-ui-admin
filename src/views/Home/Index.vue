<template>
  <div>
    <el-card shadow="never">
      <el-skeleton :loading="false" animated>
        <el-row :gutter="16" justify="space-between">
          <el-col :xl="12" :lg="12" :md="12" :sm="24" :xs="24">
            <div class="flex items-center">
              <el-avatar :src="avatar" :size="70" class="mr-16px">
                <img src="@/assets/imgs/avatar.gif" alt="" />
              </el-avatar>
              <div>
                <div class="text-20px"> {{ t('workplace.welcome') }} {{ username }} </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-skeleton>
    </el-card>
  </div>
</template>
<script lang="ts" setup>
import { useUserStore } from '@/store/modules/user'

defineOptions({ name: 'Home' })

const { t } = useI18n()
const userStore = useUserStore()
const avatar = userStore.getUser.avatar
const username = userStore.getUser.nickname
</script>
