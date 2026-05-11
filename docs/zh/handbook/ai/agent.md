---
title: 智能体（Agent）
createTime: 2026/05/12 00:00:00
permalink: /zh/handbook/ai/agent/
---

# 智能体（Agent）

> Agent 是能围绕目标持续调用工具、读取状态、调整步骤的 AI 系统。它的关键不在“像人”，而在于它能不能在明确权限和可审计流程里，把建议推进到行动。

## 为什么要学这个

LLM 一次回答问题，通常只是在生成文本。Agent 更进一步：它可以拆任务、查资料、调用 API、写代码、生成操作草稿、等待反馈再继续下一步。

这也是 Agent 真正的风险点。一旦它能调用工具、写入系统、提交请求或触发支付，错误就不再只是“答错”，而会变成“做错”。所以 Agent 的核心不是让模型更像人，而是让执行循环有清楚边界。

学 Agent 的重点不是追逐框架，而是建立分工：**模型负责提出候选行动，系统负责限制行动空间，用户负责批准高风险边界。**

## 第一性原理

> **Agent 不是自主权本身，而是被约束的执行循环。目标、工具、状态、权限和停止条件缺一不可。**

一个 Agent 如果只有模型和工具，就像一个会说话的脚本执行器。真正可用的 Agent 必须知道自己能做什么、不能做什么、做完如何验证、失败如何停止、谁能审计它做过的事。

- **工具比回答更危险**：读数据、写数据库、发送请求、改配置不是同一风险等级。
- **状态必须外置和可查**：任务进度、工具结果、失败原因、用户确认都要记录，不应只藏在模型上下文里。
- **停止条件要明确**：达到目标、超出预算、信息不足、风险越界、用户拒绝，都应该让 Agent 停下来。

## 知识节点

### Tool Use

Tool Use 是 Agent 调用外部能力：搜索、数据库、API、代码执行、邮件、支付接口、内部系统等。

工具让 Agent 从“会回答”变成“能做事”。但工具也让 Prompt Injection 和模型误判变得危险。一个能读网页的 Agent 被恶意网页影响，和一个能写入系统的 Agent 被恶意网页影响，后果完全不同。

工具设计要明确：

- 输入 schema
- 权限范围
- 是否只读
- 是否会产生外部副作用
- 调用前后如何记录
- 哪些调用需要人工确认

::: info 相关 topic
- [Web3 Tool Use](/zh/handbook/bridge/web3-tool-use/)：继续看 RPC、钱包和合约工具如何接入 Agent。
- [MCP](/zh/handbook/ai/mcp/)：了解工具和上下文协议化的一种方式。
:::

### Planning

Planning 是把目标拆成步骤。比如“帮我分析这个 DAO 提案”可以拆成读取提案、检索历史讨论、总结争议、检查投票机制、生成风险清单。

计划有用，但不能神化。模型生成的计划只是候选路线，不是授权。越靠近高风险动作，计划越需要被系统规则拆开检查。

一个好的 Agent plan 应该能暴露：

- 每一步需要什么工具
- 每一步读还是写
- 哪些步骤可自动执行
- 哪些步骤需要用户确认
- 失败时是否可以重试
- 最终如何验证任务完成

### State

State 是 Agent 当前任务的状态，包括用户目标、已完成步骤、工具返回、错误、预算、确认记录和最终输出。

很多 Agent Demo 把 state 只放在 prompt 历史里，这不够。生产系统需要可查询、可恢复、可审计的 state。否则你很难回答：Agent 为什么调用了这个工具？它是否已经拿到用户确认？哪一步开始偏离目标？

在有外部执行的场景里，state 还应该记录环境、版本、关键参数、工具调用结果、确认请求和撤销事件。

::: info 相关 topic
- [Agent Workflow](/zh/handbook/bridge/agent-workflow/)：看 Agent 从目标到执行的流程拆分。
- [Chain-aware Context](/zh/handbook/bridge/chain-aware-context/)：理解链上状态如何进入并影响 Agent 决策。
:::

### Reflection

Reflection 是让 Agent 检查自己的中间结果，例如发现信息不足、工具失败、计划不合理，然后修正下一步。

它适合提升复杂任务质量，但不能替代外部验证。Agent 自我反思仍然由模型完成，模型可能给自己的错误找理由。尤其是写入、授权、支付这类动作，reflection 只能作为辅助诊断，不能作为最终安全判断。

**自我检查可以提高质量，确定性检查才能承载风险。**

### Multi-Agent

Multi-Agent 是多个 Agent 分工协作，例如研究 Agent 读资料，开发 Agent 写代码，安全 Agent 做风险审查，执行 Agent 调用工具。

它适合复杂工作流，但也会放大协调问题：上下文传递丢失、责任边界模糊、一个 Agent 的错误被另一个 Agent 当成事实、工具权限扩散。

做 Multi-Agent 时，要先问一个朴素问题：多个 Agent 是否真的减少复杂度？如果只是把一个不清楚的流程拆成多个不清楚的角色，系统会更难调试。

## 在 AI x Web3 中的位置

Agent 位在模型能力和链上执行之间。它可以把用户目标推进成多步流程，但不能绕过账户、权限和结算规则。

一个相对稳的 AI x Web3 Agent 架构通常是：

1. 用户提出目标和约束。
2. Agent 读取上下文并生成计划。
3. 系统把计划拆成只读步骤和候选写入步骤。
4. 只读工具自动执行，写入工具进入 policy 检查。
5. Simulation 展示链上影响。
6. 用户确认高风险动作。
7. Wallet / Smart Account 执行。
8. 日志记录每一步和最终状态。

最危险的设计是让 Agent 同时拥有模糊目标、广泛工具、长期记忆和大额资产权限。

## 最小实践

做一个“DAO 提案研究 Agent”的最小版本。

它只能执行只读动作：

- 读取提案正文
- 检索论坛讨论
- 总结支持和反对理由
- 标记缺失信息
- 输出投票前检查清单

不要让它直接投票。相反，要求它在输出里明确：

- 用了哪些来源
- 哪些结论证据不足
- 是否发现治理或资金风险
- 如果用户要投票，还需要人工检查什么

完成后，再设计一个权限升级版本：只有当用户明确授权，并经过投票交易 simulation 后，系统才允许生成投票交易草稿。

## 扩展阅读

- [OpenAI Agents Guide](https://platform.openai.com/docs/guides/agents/best-practices)：理解 Agent 工作流、工具、guardrails、知识和监控的基础组成。
- [OpenAI Agents SDK](https://platform.openai.com/docs/guides/agents-sdk/)：查看用 SDK 构建带工具、handoff、streaming 和 tracing 的 Agent 应用。
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)：适合学习有状态、多步骤、可恢复的 Agent workflow。
- [Anthropic: Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)：从工程角度区分 workflow 和 agent，适合校准复杂度。
- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)：重点看过度代理、Prompt Injection、工具滥用和敏感信息泄露风险。
