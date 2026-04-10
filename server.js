require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors()); // 允许前端网页访问
app.use(express.json());
app.use(express.static('public')); // 让后端把 public 里的网页暴露出去

// 核心诊断接口
// 核心诊断接口
app.post('/api/diagnose', async (req, res) => {
    try {
        console.log("📥 收到前端请求，正在呼叫大模型...");
        const { options, interview, wrong_question } = req.body;

        const response = await axios.post(
            'https://api.coze.cn/v1/workflow/run',
            {
                // 【修复点 1】直接写死工作流 ID，彻底避开 Render 环境变量读取失败的坑
                workflow_id: process.env.WORKFLOW_ID || "7624431700663238710",
                // 【修复点 2】强制补全 bot_id！满足扣子插件和智能体绑定的硬性要求
                bot_id: "7624357703825440795",
                parameters: {
                    options: options || "",
                    interview_summary: interview || "", // ✅ 名字完全对齐扣子
                    wrong_question: wrong_question || ""
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.COZE_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log("🔍 扣子真实回应:", JSON.stringify(response.data));

        // 如果扣子的 code 不是 0，说明被拒绝了
        if (response.data.code !== 0) {
            console.error("❌ 扣子拒绝了请求:", response.data.msg);
            return res.json({ success: false, message: `扣子报错: ${response.data.msg}` });
        }

        console.log("✅ 大模型精算完成，正在返回数据...");
        res.json({ success: true, data: response.data.data });

    } catch (error) {
        console.error("❌ 请求报错:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: "引擎过载或网络通信错误，请检查后台日志。" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Infinite Study 后端引擎已成功点火！运行在 http://localhost:${PORT}`);
});
