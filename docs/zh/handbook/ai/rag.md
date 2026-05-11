---
title: 检索增强生成（RAG）
createTime: 2026/05/12 00:00:00
permalink: /zh/handbook/ai/rag/
---

# 检索增强生成（RAG）

> RAG 不是“给模型接一个向量库”这么简单。它是一条把外部知识取回、筛选、引用、交给模型使用的证据链，用来减少过期知识和无来源回答。

## 为什么要学这个

LLM 的训练知识会过期，context window 也放不下整个互联网、全部协议文档和历史治理讨论。RAG 的作用是：当用户提出问题时，系统先从知识库里找相关材料，再让模型基于这些材料回答。

在真实 AI 应用里，RAG 很常见：产品文档问答、代码库助手、研究摘要、客服知识库、SDK Copilot、内部知识检索。但很多 RAG Demo 只做到了“能搜到一些段落”，还没有做到“答案能被验证”。

RAG 的核心不是让回答更长，而是让回答有来源、有版本、有边界。**没有 citation 和 freshness 的 RAG，只是把幻觉从模型内部搬到了检索系统里。**

## 第一性原理

> **RAG 的可靠性取决于证据链，不取决于向量库这个名词。**

一个 RAG 系统至少有三次判断：文档怎么切，查询时取哪些内容，生成时如何引用和拒答。任何一层做错，模型都会拿着错误材料说得很顺。

- **检索结果不是事实**：它只是候选证据，仍要看来源、时间、版本和适用范围。
- **引用要能回到原文**：答案里的关键判断应该能追溯到具体文档、段落或链上记录。
- **检索失败要允许拒答**：找不到证据时，系统应该说“不确定”，而不是让模型补全。

## 知识节点

### Chunking

Chunking 是把长文档切成可检索片段。切太小，语义断裂；切太大，检索结果噪声多，token 成本高。

技术文档尤其需要小心切分。函数说明、参数表、风险提示、版本说明、示例代码经常跨段落出现。如果只按固定字数切，模型可能拿到函数名却拿不到限制条件。

比较稳的做法是按结构切：标题、API endpoint、函数说明、标准小节、FAQ 问答、审计或变更记录。每个 chunk 保留来源 URL、标题路径、更新时间和版本。

### Vector DB

Vector DB 用来存储 embedding，并按相似度检索相关 chunk。它解决的是“语义相近内容怎么快速找到”的问题。

但向量相似不等于答案正确。一个旧版本 SDK 文档可能和用户问题高度相似，却已经不适用；一个第三方博客可能写得很像官方文档，却缺少权威性。

所以 Vector DB 里不应该只存向量，还要存 metadata：来源、版本、chain、更新时间、可信等级、是否废弃。检索时先过滤，再排序。

::: info 相关 topic
- [Embedding](/zh/handbook/ai/llm/)：先理解文本如何变成可比较的向量。
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)：看 embedding 常见用途和向量相似度基础。
:::

### Retriever

Retriever 是根据用户问题取回候选材料的组件。它可以是向量检索、关键词检索、混合检索、图检索，也可以加上 metadata filter。

好的 retriever 不能只看语义相似度。它还要知道用户问的是哪个产品、哪个版本、哪段时间、官方文档还是社区讨论。比如同一个 API 在不同 SDK 版本里可能参数不同。

一个实用判断：**如果用户问题里有版本、环境、时间、地址或具体对象，你的 retriever 就不应该只做纯向量搜索。**

### Rerank

Rerank 是在初步检索后，对候选材料重新排序，把更相关、更可信、更完整的内容排到前面。

它常用于候选结果很多、相似度接近或混合检索的场景。对技术文档问答来说，rerank 可以减少“标题相似但内容不对”的结果；对治理讨论来说，它可以把真正讨论核心争议的段落排在闲聊前面。

Rerank 会增加延迟和成本，所以要看场景。面向资产风险或开发者文档的问答，通常值得加；小型 FAQ 未必需要。

### Citation

Citation 是把答案里的关键结论连接回来源。它不是装饰，而是用户验证答案的入口。

在技术问答里，citation 至少要能说明：

- 这句话来自哪份文档或链上记录
- 来源是否官方
- 文档版本或更新时间
- 哪些结论只是模型归纳
- 哪些地方没有足够证据

如果一个 RAG 系统不能展示来源，用户就很难判断答案是基于文档、基于旧知识，还是模型自己补出来的。

## 在 AI x Web3 中的位置

RAG 位在 Knowledge Base 和模型之间。它帮 Agent 查资料、补上下文、引用证据，但不负责最终执行。

常见应用包括：

- 协议文档问答
- 合约接口解释
- 治理提案和论坛摘要
- 审计报告检索
- SDK / API Copilot
- 交易解释时补充项目背景

当 RAG 结果要影响链上动作时，还需要接 simulation、policy 和 human check。文档说某函数“可以调用”，不等于当前用户“应该签名”。

## 最小实践

做一个“协议文档 RAG 问答”的最小版本。

选择一个官方文档站，抓取 10 到 20 篇页面，按标题结构切 chunk，存入向量库。用户提问时，系统返回答案和引用。

至少测试三类问题：

- 文档中明确存在的 API 用法
- 文档中不存在的问题，要求系统拒答
- 旧版本或不确定版本的问题，要求系统提示需要核对版本

输出时强制区分：

- `answer`
- `sources`
- `uncertainties`
- `needs_version_check`

这个练习的重点是证据链，不是 UI。

## 扩展阅读

- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)：理解向量表示如何支持语义搜索、聚类和 RAG。
- [OpenAI File Search Guide](https://platform.openai.com/docs/guides/tools-file-search)：了解托管文件检索如何把外部资料接入模型工作流。
- [LangChain Retrievers](https://docs.langchain.com/oss/python/integrations/retrievers/index)：查看常见 retriever、向量库、reranker 和混合检索集成。
- [Pinecone RAG Guide](https://docs.pinecone.io/guides/get-started/build-a-rag-chatbot)：适合看一个向量数据库视角下的 RAG 数据流。
- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)：关注向量和 embedding 风险、Prompt Injection、错误信息传播等安全问题。
