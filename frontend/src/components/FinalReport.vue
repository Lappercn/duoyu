<template>
  <div class="report-modal">
    <div class="report-content" id="report-content">
      <div class="header">
        <h1>多鱼理财 · 深度投资分析报告</h1>
        <p class="subtitle">生成时间: {{ new Date().toLocaleString() }}</p>
      </div>
      
      <div class="section">
        <h2>一、核心决策</h2>
        <div class="decision-box" :class="data.decision">
          {{ data.decision === 'BUY' ? '强烈买入' : data.decision === 'SELL' ? '建议卖出' : '观望持有' }}
        </div>
        <p class="reasoning">{{ data.reasoning }}</p>
      </div>

      <div class="section">
        <h2>二、多空观点复盘</h2>
        <div class="debate-summary">
           <!-- We could inject summary here if we had it parsed, for now placeholder -->
           <p>基于机会挖掘官与风险预警官的深度辩论，市场分歧主要集中在短期估值与长期增长潜力上。</p>
        </div>
      </div>

      <div class="footer">
        <p>声明：本报告由AI生成，仅供参考，不构成投资建议。</p>
        <p>Duoyu Finance AI Agent System</p>
      </div>
    </div>
    
    <div class="actions">
      <el-button type="primary" @click="printReport">导出 PDF / 打印</el-button>
      <el-button @click="$emit('close')">关闭</el-button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  data: Object
})

const printReport = () => {
  window.print()
}
</script>

<style scoped>
.report-modal {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  overflow-y: auto;
  padding: 20px;
}

.report-content {
  background: #fff;
  color: #2c3e50;
  width: 210mm; /* A4 width */
  min-height: 297mm;
  padding: 25mm;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  margin-bottom: 20px;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
  position: relative;
}

/* Watermark-like decoration */
.report-content::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 10px;
    background: linear-gradient(90deg, #1a1c2c, #4a90e2, #1a1c2c);
}

.header {
  text-align: center;
  border-bottom: 3px double #eee;
  margin-bottom: 40px;
  padding-bottom: 25px;
}

.header h1 { 
    font-size: 32px; 
    margin-bottom: 15px; 
    color: #1a1c2c;
    font-weight: 800;
    letter-spacing: 2px;
}
.subtitle { 
    color: #7f8c8d; 
    font-size: 14px;
    font-family: monospace;
}

.section { margin-bottom: 40px; }
.section h2 { 
    font-size: 20px; 
    border-left: 6px solid #1a1c2c; 
    padding-left: 15px; 
    margin-bottom: 20px;
    color: #34495e;
    background: linear-gradient(90deg, #f8f9fa, transparent);
    padding-top: 5px;
    padding-bottom: 5px;
}

.decision-box {
    font-size: 48px;
    font-weight: 900;
    text-align: center;
    padding: 40px;
    margin: 30px 0;
    border-radius: 16px;
    position: relative;
    overflow: hidden;
    transition: transform 0.3s;
}

.decision-box::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.2) 50%, transparent 55%);
    background-size: 200% 200%;
    animation: shine 3s infinite;
}

@keyframes shine {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

.decision-box.BUY { 
    color: #c0392b; 
    background: linear-gradient(135deg, #fadbd8, #fdedec); 
    border: 2px solid #e74c3c;
    box-shadow: 0 10px 20px rgba(231, 76, 60, 0.15);
}
.decision-box.SELL { 
    color: #27ae60; 
    background: linear-gradient(135deg, #d5f5e3, #eafaf1); 
    border: 2px solid #2ecc71; 
    box-shadow: 0 10px 20px rgba(46, 204, 113, 0.15);
}
.decision-box.HOLD { 
    color: #d35400; 
    background: linear-gradient(135deg, #fdebd0, #fef5e7); 
    border: 2px solid #f39c12; 
    box-shadow: 0 10px 20px rgba(243, 156, 18, 0.15);
}

.reasoning { 
    line-height: 2; 
    text-align: justify; 
    font-size: 16px;
    color: #2c3e50;
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #eee;
}

.debate-summary p {
    font-size: 16px;
    line-height: 1.8;
    color: #555;
}

.footer {
    margin-top: 60px;
    text-align: center;
    font-size: 12px;
    color: #bdc3c7;
    border-top: 1px solid #ecf0f1;
    padding-top: 30px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.actions {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
}

@media print {
  .report-modal { position: static; background: white; display: block; padding: 0; height: auto; overflow: visible; }
  .actions { display: none; }
  .report-content { box-shadow: none; margin: 0; width: 100%; min-height: auto; padding: 0; }
  .report-content::before { display: none; }
  body * { visibility: hidden; }
  .report-modal, .report-modal * { visibility: visible; }
  .report-modal { position: absolute; left: 0; top: 0; }
  .decision-box { box-shadow: none !important; border-width: 5px !important; -webkit-print-color-adjust: exact; }
}
</style>
