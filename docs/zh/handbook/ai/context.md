---
title: 上下文（Context）
createTime: 2026/05/12 00:00:00
permalink: /zh/handbook/ai/context/
---

# 上下文（Context）

> Context 是模型这一次能看到、能使用、能被影响的信息空间。真正难的不是把更多内容塞进去，而是把系统规则、用户目标、历史状态、工具结果和外部文档分清楚。

## 为什么要学这个

LLM 没有自动连接你的数据库、文件系统、API、用户历史和项目文档。它只会基于当前上下文生成输出。如果上下文错了、缺了、过期了，模型再强也会给出不可靠答案。

很多 AI 应用的问题表面看是“模型不够聪明”，实际是 context 设计混乱：把不可信网页当系统指令，把旧文档当最新规则，把用户愿望当事实，把上一次任务的状态泄漏到下一次任务。

在任何带工具调用的场景里，这都会直接影响安全。模型如果看不到真实工具结果，就只能猜；Agent 如果不知道当前状态、权限和预算，就可能生成越界操作。

## 第一性原理

> **模型只能基于它看见的上下文行动；系统必须决定什么能进上下文、带着什么身份进去、过期后怎么退出。**

Context 不是简单的长文本拼接，而是一套信息治理问题。你要为每类信息标注来源、时效、权限和可信度。否则模型会把“用户说的”“网页写的”“链上查到的”“系统规定的”混在同一层处理。

- **可信来源要显式标注**：系统状态、用户输入、检索文档、工具结果要分区放置。
- **上下文要可刷新**：状态、配置、权限、价格、版本和任务进度不能长期缓存后继续使用。
- **记忆要可撤销**：用户偏好和历史任务可以提升体验，但不能变成隐藏权限或永久身份假设。

## 知识节点

### Context Window

Context Window 是模型一次请求能处理的最大上下文范围。窗口越大，能放进来的资料越多，但不代表模型会完美使用每个细节。

长上下文常见的问题是“看见了但没抓住重点”。如果你把合约源码、审计报告、治理讨论和交易日志全部塞进去，模型可能被无关内容分散注意力，也可能引用过期段落。

在实际产品里，context window 应该配合检索、摘要和结构化数据使用。关键状态直接给，长文档按需取，低可信内容隔离标注。

### Context Engineering

Context Engineering 是设计上下文进入模型的方式。它包括选择数据源、排序、裁剪、标注来源、隔离不可信内容、决定哪些信息必须每次重新查询。

一个稳定的工具型 Agent 上下文，通常不只是“用户问题 + 一段 JSON”。它还应该包括：

- 当前任务状态
- 工具返回结果
- 相关日志或证据
- 可信数据来源
- 外部检查结果
- 用户原始意图
- 系统禁止事项和输出 schema

**Context Engineering 的目标不是塞满窗口，而是让模型在正确的信息层级里工作。**

::: info 相关 topic
- [Chain-aware Context](/zh/handbook/bridge/chain-aware-context/)：继续看链上状态如何进入 Agent 上下文。
- [RAG](/zh/handbook/ai/rag/)：当上下文来自大量文档时，需要检索和引用机制。
:::

### Memory

Memory 是跨请求保留的信息，例如用户偏好、历史任务、常用钱包、项目配置、上次分析结果。

Memory 可以让 Agent 更顺手，但也容易带来隐性风险。比如系统记住“用户常用 0xabc 地址”，下次就默认它是收款地址；或者记住“用户风险偏好较高”，就放松了高风险交易确认。

Memory 不能替代实时授权。用户过去允许某个动作，不代表现在仍然允许。**所有涉及身份、权限、资产或外部副作用的记忆，都必须重新绑定当前会话和当前授权。**

### Knowledge Base

Knowledge Base 是系统可检索的外部知识库，比如产品文档、SDK 文档、代码说明、论坛讨论、FAQ、内部 runbook。

它适合解决模型知识过期的问题，但不会自动保证正确。知识库需要维护来源、更新时间、版本、适用网络和废弃状态。否则 RAG 只会把旧错误更稳定地送进模型。

对 builders 来说，知识库至少要记录：

- 文档来源和 URL
- 最后更新时间
- 适用协议版本
- 适用版本或运行环境
- 是否来自官方或第三方
- 是否需要人工复核

## 在 AI x Web3 中的位置

Context 是连接模型和现实系统的入口。AI 负责推理，Web3 负责状态和结算；context 决定模型看到的是用户幻想、过期文档，还是可验证的链上事实。

一个靠谱的 Agent 上下文通常会分层：

- 指令层：系统规则、工具使用规则、禁止事项。
- 任务层：用户目标、本次会话参数。
- 事实层：链上状态、工具结果、simulation。
- 知识层：文档、标准、论坛、历史案例。
- 记忆层：用户偏好和项目配置。

层级越清楚，后续越容易做权限控制、prompt injection 防护和审计。

## 最小实践

为“钱包授权检查 Agent”设计一份 context spec。

选择一个场景：用户问“这个 dApp 要我 approve，可以签吗？”你需要列出模型回答前必须拿到的上下文：

- chain id 和当前区块
- token 合约、spender 地址、approve 数量
- 用户当前 allowance 和余额
- spender 是否在可信列表
- simulation 或静态检查结果
- dApp 页面提供的说明，标记为不可信外部内容
- 用户本次意图

再写清楚哪些字段必须实时查询，哪些可以来自缓存，哪些不能被模型当成事实。

## 扩展阅读

- [OpenAI Text Generation Guide](https://platform.openai.com/docs/guides/text-generation)：理解模型输入、消息角色、输出和上下文管理的基础。
- [OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)：看如何组织上下文、示例和格式边界。
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)：理解知识库和语义检索如何为上下文提供材料。
- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)：重点关注 Prompt Injection、敏感信息泄露和向量/embedding 相关风险。
- [LangChain Retrieval Documentation](https://docs.langchain.com/oss/python/integrations/retrievers/index)：了解不同 retriever 如何把外部知识送进模型上下文。
