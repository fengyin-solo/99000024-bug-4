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
      v-else-if="!loading && status === 'not-found'"
      icon="warning"
      title="文章不存在"
      sub-title="文章可能已被删除，或链接有误"
    >
      <template #extra>
        <el-button type="primary" @click="goBack">返回列表</el-button>
      </template>
    </el-result>

    <el-result
      v-else-if="!loading && status === 'error'"
      icon="error"
      title="加载失败"
      sub-title="网络或服务出现异常，请稍后重试"
    >
      <template #extra>
        <el-button type="primary" @click="fetchArticle">重试</el-button>
        <el-button @click="goBack">返回列表</el-button>
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
const loading = ref(true)
// 'idle' | 'ready' | 'not-found' | 'error'
const status = ref('idle')
// Monotonic id so an out-of-order response can never overwrite a newer request.
let requestSeq = 0

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true
})

const hasBody = computed(() => !!article.value?.body?.trim())

const renderedContent = computed(() => {
  if (!hasBody.value) return ''
  return marked(article.value.body)
})

onMounted(() => {
  fetchArticle()
})

// The component instance can be reused when navigating from one article to
// another; refetch so the previous article (or its failure) never leaks in.
watch(() => route.params.id, (newId, oldId) => {
  if (route.name === 'ArticleDetail' && newId && newId !== oldId) {
    fetchArticle()
  }
})

async function fetchArticle() {
  const seq = ++requestSeq
  const { id } = route.params
  loading.value = true
  // Clear the previous result up front so stale content or a stale failure
  // state is never shown for the new article.
  article.value = null
  status.value = 'idle'
  try {
    const response = await api.get(`/articles/${id}`)
    if (seq !== requestSeq) return // superseded by a newer request
    article.value = response.data
    status.value = 'ready'
  } catch (error) {
    if (seq !== requestSeq) return
    // 404 means the article is gone (retrying won't help); anything else is
    // a transient load failure that the user can retry.
    status.value = error.response?.status === 404 ? 'not-found' : 'error'
    console.error('Failed to fetch article:', error)
  } finally {
    if (seq === requestSeq) {
      loading.value = false
    }
  }
}

function goBack() {
  // Prefer the in-app history entry so the list keeps its page, filters and
  // scroll position; fall back to the home page for direct visits.
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
