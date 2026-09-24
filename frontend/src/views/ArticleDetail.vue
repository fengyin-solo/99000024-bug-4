<template>
  <div class="article-detail" v-loading="loading">
    <template v-if="article">
      <el-card>
        <template #header>
          <div class="article-header">
            <h1 class="article-title">{{ article.title }}</h1>
            <div class="article-meta">
              <span class="article-date">
                发布于 {{ formatDate(article.created_at) }}
              </span>
              <span v-if="article.updated_at !== article.created_at" class="article-date">
                更新于 {{ formatDate(article.updated_at) }}
              </span>
            </div>
            <div class="article-tags">
              <el-tag v-for="tag in article.tags" :key="tag" size="small">
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </template>

        <div v-if="hasBody" class="article-content" v-html="renderedContent"></div>
        <el-empty v-else description="本文暂无正文内容" :image-size="80" />
      </el-card>

      <div class="back-button">
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </el-button>
      </div>
    </template>

    <el-result
      v-else-if="!loading && error"
      :icon="error.type === 'not-found' ? 'warning' : 'error'"
      :title="error.type === 'not-found' ? '文章不存在' : '文章加载失败'"
      :sub-title="error.type === 'not-found'
        ? '文章可能已被删除，或链接地址有误'
        : '网络异常或服务器出错，请检查网络连接后重试'"
    >
      <template #extra>
        <el-button
          v-if="error.type === 'load-failed'"
          type="primary"
          @click="fetchArticle"
        >
          重试
        </el-button>
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { marked } from 'marked'
import api from '../api'

const route = useRoute()
const router = useRouter()

const article = ref(null)
const loading = ref(false)
// 加载失败原因：null | { type: 'not-found' | 'load-failed' }
const error = ref(null)

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true
})

const hasBody = computed(() => {
  return !!(article.value?.body && article.value.body.trim())
})

const renderedContent = computed(() => {
  if (!hasBody.value) return ''
  return marked(article.value.body)
})

onMounted(() => {
  fetchArticle()
})

// 组件复用切换文章（如 /article/1 -> /article/2）时重新加载，
// fetchArticle 会先清空旧数据，避免残留上一篇的内容或失败状态
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    fetchArticle()
  }
})

async function fetchArticle() {
  loading.value = true
  article.value = null
  error.value = null
  try {
    const { id } = route.params
    const response = await api.get(`/articles/${id}`)
    article.value = response.data
  } catch (err) {
    console.error('Failed to fetch article:', err)
    error.value = {
      type: err.response?.status === 404 ? 'not-found' : 'load-failed'
    }
  } finally {
    loading.value = false
  }
}

function goBack() {
  // 有历史记录时回退，保留列表的页码与滚动位置；直接打开详情页时回到首页
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.article-detail {
  max-width: 800px;
  margin: 0 auto;
  padding-top: 20px;
  min-height: 200px;
}

.article-header {
  margin-bottom: 20px;
}

.article-title {
  font-size: 28px;
  color: #303133;
  margin-bottom: 12px;
}

.article-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.article-date {
  color: #909399;
  font-size: 14px;
}

.article-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.article-content {
  line-height: 1.8;
  font-size: 16px;
}

.article-content :deep(h1) {
  font-size: 24px;
  margin: 24px 0 16px;
  color: #303133;
}

.article-content :deep(h2) {
  font-size: 20px;
  margin: 20px 0 12px;
  color: #303133;
}

.article-content :deep(h3) {
  font-size: 18px;
  margin: 16px 0 8px;
  color: #303133;
}

.article-content :deep(p) {
  margin-bottom: 16px;
}

.article-content :deep(pre) {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  margin-bottom: 16px;
}

.article-content :deep(code) {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 14px;
}

.article-content :deep(ul),
.article-content :deep(ol) {
  margin-bottom: 16px;
  padding-left: 24px;
}

.article-content :deep(li) {
  margin-bottom: 8px;
}

.article-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.article-content :deep(th),
.article-content :deep(td) {
  border: 1px solid #dcdfe6;
  padding: 8px 12px;
  text-align: left;
}

.article-content :deep(th) {
  background-color: #f5f7fa;
}

.back-button {
  margin-top: 20px;
}
</style>
