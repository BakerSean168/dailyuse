/**
 * Goal Templates - Built-in OKR Templates
 * 目标模板 - 内置 OKR 模板
 *
 * NOTE: 此文件属于模板数据，非核心领域逻辑，允许保留在应用层的 domain/templates/ 目录中。
 * 参考：FRONTEND_ARCHITECTURE_GUIDE.md - "临时例外" 规则
 */

/**
 * 目标模板接口
 */
export interface GoalTemplate {
  /** 模板唯一标识 */
  id: string;
  /** 模板标题 */
  title: string;
  /** 模板描述 */
  description: string;
  /** 目标类别 */
  category: 'product' | 'engineering' | 'sales' | 'marketing' | 'general';
  /** 适用角色 */
  roles: string[];
  /** 适用行业 */
  industries: string[];
  /** 推荐的时间范围（天数） */
  suggestedDuration?: number;
  /** 关键结果模板 */
  keyResults: KeyResultTemplate[];
  /** 标签 */
  tags: string[];
}

/**
 * 关键结果模板接口
 */
export interface KeyResultTemplate {
  /** KR 标题 */
  title: string;
  /** 建议权重 (%) */
  suggestedWeight: number;
  /** 度量指标示例 */
  metrics: string[];
  /** 起始值建议 */
  suggestedStartValue?: number;
  /** 目标值建议 */
  suggestedTargetValue?: number;
  /** 单位 */
  unit?: string;
}

/**
 * 内置目标模板库
 */
export const BUILT_IN_TEMPLATES: GoalTemplate[] = [
  // ========== Product Management ==========
  {
    id: 'pm-product-launch',
    title: '产品发布 OKR',
    description: '新产品/功能成功上线并获得用户认可',
    category: 'product',
    roles: ['产品经理', 'Product Manager', 'PM'],
    industries: ['SaaS', '互联网', 'Technology'],
    suggestedDuration: 90,
    tags: ['产品发布', '用户增长', 'NPS'],
    keyResults: [
      {
        title: '首月获得活跃用户数',
        suggestedWeight: 40,
        metrics: ['DAU', 'MAU', '注册用户数'],
        suggestedStartValue: 0,
        suggestedTargetValue: 1000,
        unit: '人',
      },
      {
        title: 'NPS 用户满意度评分',
        suggestedWeight: 30,
        metrics: ['NPS', '满意度', '推荐率'],
        suggestedStartValue: 0,
        suggestedTargetValue: 8,
        unit: '分',
      },
      {
        title: '核心功能采用率',
        suggestedWeight: 30,
        metrics: ['功能使用率', '留存率', '活跃度'],
        suggestedStartValue: 0,
        suggestedTargetValue: 60,
        unit: '%',
      },
    ],
  },
  {
    id: 'pm-user-growth',
    title: '用户增长 OKR',
    description: '通过优化产品体验提升用户增长和留存',
    category: 'product',
    roles: ['产品经理', 'Growth PM', '增长负责人'],
    industries: ['SaaS', '互联网', '电商'],
    suggestedDuration: 90,
    tags: ['用户增长', '留存', '转化率'],
    keyResults: [
      {
        title: '月活跃用户增长',
        suggestedWeight: 50,
        metrics: ['MAU', '增长率', '新增用户'],
        suggestedStartValue: 10000,
        suggestedTargetValue: 15000,
        unit: '人',
      },
      {
        title: '用户留存率提升',
        suggestedWeight: 30,
        metrics: ['7日留存', '30日留存', '次日留存'],
        suggestedStartValue: 40,
        suggestedTargetValue: 60,
        unit: '%',
      },
      {
        title: '新用户转化率',
        suggestedWeight: 20,
        metrics: ['注册转化', '付费转化', '激活率'],
        suggestedStartValue: 15,
        suggestedTargetValue: 25,
        unit: '%',
      },
    ],
  },

  // ========== Engineering ==========
  {
    id: 'eng-velocity',
    title: '研发效能提升 OKR',
    description: '提升团队交付速度和代码质量',
    category: 'engineering',
    roles: ['技术负责人', 'Engineering Manager', 'Tech Lead'],
    industries: ['SaaS', '互联网', 'Technology'],
    suggestedDuration: 90,
    tags: ['研发效能', '代码质量', '交付速度'],
    keyResults: [
      {
        title: '减少线上 Bug 数量',
        suggestedWeight: 35,
        metrics: ['Bug 数量', '严重 Bug', '回归率'],
        suggestedStartValue: 50,
        suggestedTargetValue: 35,
        unit: '个',
      },
      {
        title: '提升部署频率',
        suggestedWeight: 35,
        metrics: ['部署次数', '发布周期', 'Lead Time'],
        suggestedStartValue: 1,
        suggestedTargetValue: 2,
        unit: '次/周',
      },
      {
        title: '代码覆盖率达标',
        suggestedWeight: 30,
        metrics: ['单元测试覆盖率', '集成测试', '代码审查'],
        suggestedStartValue: 70,
        suggestedTargetValue: 85,
        unit: '%',
      },
    ],
  },
  {
    id: 'eng-tech-debt',
    title: '技术债务清理 OKR',
    description: '系统性降低技术债务，提升代码健康度',
    category: 'engineering',
    roles: ['技术负责人', 'CTO', 'Tech Lead'],
    industries: ['SaaS', '互联网', '金融科技'],
    suggestedDuration: 60,
    tags: ['技术债', '重构', '性能优化'],
    keyResults: [
      {
        title: '重构遗留代码模块',
        suggestedWeight: 40,
        metrics: ['重构模块数', '代码复杂度', '依赖解耦'],
        suggestedStartValue: 0,
        suggestedTargetValue: 5,
        unit: '个',
      },
      {
        title: '系统性能提升',
        suggestedWeight: 35,
        metrics: ['响应时间', 'API 延迟', '吞吐量'],
        suggestedStartValue: 500,
        suggestedTargetValue: 200,
        unit: 'ms',
      },
      {
        title: '减少技术债 Story 数',
        suggestedWeight: 25,
        metrics: ['债务 Story', 'TODO 数量', '告警数'],
        suggestedStartValue: 30,
        suggestedTargetValue: 10,
        unit: '个',
      },
    ],
  },

  // ========== Sales ==========
  {
    id: 'sales-revenue-growth',
    title: '销售收入增长 OKR',
    description: '通过扩大客户群和提升客单价增加收入',
    category: 'sales',
    roles: ['销售总监', 'Sales Manager', 'VP Sales'],
    industries: ['SaaS', 'B2B', '企业服务'],
    suggestedDuration: 90,
    tags: ['销售增长', '收入', 'MRR'],
    keyResults: [
      {
        title: 'MRR 月经常性收入增长',
        suggestedWeight: 50,
        metrics: ['MRR', 'ARR', '合同金额'],
        suggestedStartValue: 100000,
        suggestedTargetValue: 125000,
        unit: '元',
      },
      {
        title: '新增付费客户数',
        suggestedWeight: 30,
        metrics: ['新客户', '签约数', '转化数'],
        suggestedStartValue: 20,
        suggestedTargetValue: 70,
        unit: '家',
      },
      {
        title: '客户流失率控制',
        suggestedWeight: 20,
        metrics: ['Churn Rate', '续约率', '满意度'],
        suggestedStartValue: 10,
        suggestedTargetValue: 5,
        unit: '%',
      },
    ],
  },
  {
    id: 'sales-customer-success',
    title: '客户成功 OKR',
    description: '提升客户满意度和续约率，降低流失',
    category: 'sales',
    roles: ['客户成功经理', 'CSM', 'Account Manager'],
    industries: ['SaaS', 'B2B', '订阅服务'],
    suggestedDuration: 90,
    tags: ['客户成功', '续约', 'NPS'],
    keyResults: [
      {
        title: '客户续约率提升',
        suggestedWeight: 45,
        metrics: ['续约率', '续费金额', '留存率'],
        suggestedStartValue: 75,
        suggestedTargetValue: 90,
        unit: '%',
      },
      {
        title: 'NPS 净推荐值提升',
        suggestedWeight: 30,
        metrics: ['NPS', '满意度', '推荐率'],
        suggestedStartValue: 6,
        suggestedTargetValue: 8.5,
        unit: '分',
      },
      {
        title: '客户健康度改善',
        suggestedWeight: 25,
        metrics: ['活跃度', '使用频率', '功能采用'],
        suggestedStartValue: 60,
        suggestedTargetValue: 85,
        unit: '%',
      },
    ],
  },

  // ========== Marketing ==========
  {
    id: 'marketing-brand-awareness',
    title: '品牌知名度提升 OKR',
    description: '通过内容营销和社交媒体扩大品牌影响力',
    category: 'marketing',
    roles: ['市场总监', 'Marketing Manager', 'CMO'],
    industries: ['SaaS', '消费品', '互联网'],
    suggestedDuration: 90,
    tags: ['品牌', '内容营销', '社交媒体'],
    keyResults: [
      {
        title: '社交媒体粉丝增长',
        suggestedWeight: 35,
        metrics: ['粉丝数', '关注量', '社交触达'],
        suggestedStartValue: 10000,
        suggestedTargetValue: 25000,
        unit: '人',
      },
      {
        title: '内容阅读量提升',
        suggestedWeight: 35,
        metrics: ['文章阅读', '视频播放', '内容分享'],
        suggestedStartValue: 50000,
        suggestedTargetValue: 100000,
        unit: '次',
      },
      {
        title: '品牌搜索量增长',
        suggestedWeight: 30,
        metrics: ['品牌搜索', 'SEO 排名', '自然流量'],
        suggestedStartValue: 1000,
        suggestedTargetValue: 2500,
        unit: '次/月',
      },
    ],
  },
  {
    id: 'marketing-lead-generation',
    title: '线索获取 OKR',
    description: '通过营销活动获取高质量销售线索',
    category: 'marketing',
    roles: ['市场总监', 'Demand Gen', 'Growth Marketing'],
    industries: ['SaaS', 'B2B', '企业服务'],
    suggestedDuration: 90,
    tags: ['获客', 'MQL', '转化'],
    keyResults: [
      {
        title: 'MQL 营销线索数量',
        suggestedWeight: 45,
        metrics: ['MQL', '有效线索', '注册数'],
        suggestedStartValue: 200,
        suggestedTargetValue: 500,
        unit: '个',
      },
      {
        title: 'MQL 到 SQL 转化率',
        suggestedWeight: 30,
        metrics: ['转化率', '销售接受率', '质量评分'],
        suggestedStartValue: 20,
        suggestedTargetValue: 35,
        unit: '%',
      },
      {
        title: '降低获客成本 CAC',
        suggestedWeight: 25,
        metrics: ['CAC', '营销 ROI', '效率提升'],
        suggestedStartValue: 500,
        suggestedTargetValue: 300,
        unit: '元',
      },
    ],
  },

  // ========== General ==========
  {
    id: 'general-team-okr',
    title: '团队协作提升 OKR',
    description: '改善团队协作效率和成员满意度',
    category: 'general',
    roles: ['团队负责人', 'Manager', 'Team Lead'],
    industries: ['通用', 'All Industries'],
    suggestedDuration: 90,
    tags: ['团队', '协作', '满意度'],
    keyResults: [
      {
        title: '团队满意度提升',
        suggestedWeight: 40,
        metrics: ['员工满意度', 'eNPS', '幸福感'],
        suggestedStartValue: 7,
        suggestedTargetValue: 8.5,
        unit: '分',
      },
      {
        title: '跨部门协作效率',
        suggestedWeight: 35,
        metrics: ['协作项目', '响应时间', '沟通效率'],
        suggestedStartValue: 60,
        suggestedTargetValue: 85,
        unit: '%',
      },
      {
        title: '知识分享次数',
        suggestedWeight: 25,
        metrics: ['分享会', '文档产出', '技能培训'],
        suggestedStartValue: 4,
        suggestedTargetValue: 12,
        unit: '次',
      },
    ],
  },
  {
    id: 'general-process-improvement',
    title: '流程优化 OKR',
    description: '系统性改进工作流程，提升整体效率',
    category: 'general',
    roles: ['流程负责人', 'Operations', 'PMO'],
    industries: ['通用', 'All Industries'],
    suggestedDuration: 60,
    tags: ['流程', '效率', '自动化'],
    keyResults: [
      {
        title: '流程自动化覆盖率',
        suggestedWeight: 40,
        metrics: ['自动化流程', '工具采用', '手动减少'],
        suggestedStartValue: 30,
        suggestedTargetValue: 70,
        unit: '%',
      },
      {
        title: '流程执行时间缩短',
        suggestedWeight: 35,
        metrics: ['周期时间', 'Lead Time', '等待时间'],
        suggestedStartValue: 10,
        suggestedTargetValue: 6,
        unit: '天',
      },
      {
        title: '流程文档完善度',
        suggestedWeight: 25,
        metrics: ['文档覆盖', 'SOP 数量', '更新频率'],
        suggestedStartValue: 50,
        suggestedTargetValue: 90,
        unit: '%',
      },
    ],
  },
];

/**
 * 按类别获取模板
 */
export function getTemplatesByCategory(category: GoalTemplate['category']): GoalTemplate[] {
  return BUILT_IN_TEMPLATES.filter((t) => t.category === category);
}

/**
 * 按角色获取推荐模板
 */
export function getTemplatesByRole(role: string): GoalTemplate[] {
  return BUILT_IN_TEMPLATES.filter((t) =>
    t.roles.some((r) => r.toLowerCase().includes(role.toLowerCase())),
  );
}

/**
 * 按行业获取推荐模板
 */
export function getTemplatesByIndustry(industry: string): GoalTemplate[] {
  return BUILT_IN_TEMPLATES.filter((t) =>
    t.industries.some((i) => i.toLowerCase().includes(industry.toLowerCase())),
  );
}

/**
 * 按 ID 获取模板
 */
export function getTemplateById(id: string): GoalTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id);
}
