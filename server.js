require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors()); // 允许前端网页访问
app.use(express.json());
app.use(express.static('public')); // 让后端把 public 里的网页暴露出去

// 核心诊断接口
app.post('/api/diagnose', async (req, res) => {
    try {
        console.log("📥 收到前端请求，正在呼叫大模型...");
        const { options, interview, wrong_question } = req.body;

        const response = await axios.post(
            'https://api.coze.cn/v1/workflow/run',
            {
                workflow_id: process.env.WORKFLOW_ID,
                parameters: {
                    options: options || "",
                    interview: interview || "",
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

        console.log("✅ 大模型精算完成，正在返回数据...");
        // 把工作流的输出结果传给前端
        res.json({ success: true, data: response.data.data });

    } catch (error) {
        console.error("❌ 请求报错:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: "引擎过载或配置错误，请检查后台。" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Infinite Study 后端引擎已成功点火！运行在 http://localhost:${PORT}`);
});