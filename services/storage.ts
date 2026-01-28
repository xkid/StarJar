import { Child, ActivityLog, Investment, Bank } from '../types';

const KIDS_KEY = 'starjar_kids';
const LOGS_KEY = 'starjar_logs';
const INVEST_KEY = 'starjar_investments';
const API_KEY_KEY = 'starjar_api_key';
const RATES_KEY = 'starjar_bank_rates';

// Default / Fallback Data
const DEFAULT_BANKS: Bank[] = [
  {
    id: 'mbank',
    name: 'M-Bank',
    description: 'The Tiger Bank. Strong, steady, and safe.',
    color: 'bg-yellow-400 text-yellow-900',
    rate: 2.60
  },
  {
    id: 'cbank',
    name: 'C-Bank',
    description: 'The Octopus Bank. Connects you to the world.',
    color: 'bg-red-600 text-white',
    rate: 2.75
  },
  {
    id: 'ubank',
    name: 'U-Bank',
    description: 'The Builder Bank. Solid foundations for growth.',
    color: 'bg-blue-800 text-white',
    rate: 2.80
  }
];

export const getBanks = (): Bank[] => {
  try {
    const storedRates = localStorage.getItem(RATES_KEY);
    const rateMap = storedRates ? JSON.parse(storedRates) : {};

    return DEFAULT_BANKS.map(bank => ({
      ...bank,
      // Use stored rate if available, otherwise default
      rate: typeof rateMap[bank.id] === 'number' ? rateMap[bank.id] : bank.rate
    }));
  } catch (e) {
    return DEFAULT_BANKS;
  }
};

export const updateBankRates = (newRates: Record<string, number>) => {
  localStorage.setItem(RATES_KEY, JSON.stringify(newRates));
};

export const getChildren = (): Child[] => {
  try {
    const data = localStorage.getItem(KIDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load children", e);
    return [];
  }
};

export const saveChildren = (children: Child[]) => {
  localStorage.setItem(KIDS_KEY, JSON.stringify(children));
};

export const getLogs = (): ActivityLog[] => {
  try {
    const data = localStorage.getItem(LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load logs", e);
    return [];
  }
};

export const saveLogs = (logs: ActivityLog[]) => {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
};

export const getInvestments = (): Investment[] => {
  try {
    const data = localStorage.getItem(INVEST_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load investments", e);
    return [];
  }
};

export const saveInvestments = (investments: Investment[]) => {
  localStorage.setItem(INVEST_KEY, JSON.stringify(investments));
};

export const addLogEntry = (log: ActivityLog) => {
  const logs = getLogs();
  const children = getChildren();
  
  // Update logs
  logs.push(log);
  saveLogs(logs);

  // Update child total
  const childIndex = children.findIndex(c => c.id === log.childId);
  if (childIndex >= 0) {
    children[childIndex].totalPoints += log.points;
    saveChildren(children);
  }
};

export const updateLogEntry = (updatedLog: ActivityLog) => {
  const logs = getLogs();
  const children = getChildren();
  const oldLogIndex = logs.findIndex(l => l.id === updatedLog.id);
  
  if (oldLogIndex === -1) return;

  const oldLog = logs[oldLogIndex];
  const pointsDiff = updatedLog.points - oldLog.points;

  // Update Log
  logs[oldLogIndex] = updatedLog;
  saveLogs(logs);

  // Update Child
  const childIndex = children.findIndex(c => c.id === updatedLog.childId);
  if (childIndex >= 0) {
    children[childIndex].totalPoints += pointsDiff;
    saveChildren(children);
  }
};

export const deleteLogEntry = (logId: string) => {
  let logs = getLogs();
  const children = getChildren();
  const logToRemove = logs.find(l => l.id === logId);

  if (!logToRemove) return;

  // Update Child
  const childIndex = children.findIndex(c => c.id === logToRemove.childId);
  if (childIndex >= 0) {
    children[childIndex].totalPoints -= logToRemove.points;
    saveChildren(children);
  }

  // Remove Log
  logs = logs.filter(l => l.id !== logId);
  saveLogs(logs);
};

export const createInvestment = (childId: string, bankId: string, amount: number, months: number) => {
  const banks = getBanks();
  const bank = banks.find(b => b.id === bankId);
  if (!bank) return;

  const children = getChildren();
  const child = children.find(c => c.id === childId);
  
  if (!child) return;
  if (child.totalPoints < amount) return; // Insufficient funds check

  // Calculate projected return (Simple Interest: P * R * T)
  const interest = Math.ceil(amount * (bank.rate / 100) * (months / 12));
  
  const investment: Investment = {
    id: Date.now().toString(),
    childId,
    bankId,
    principal: amount,
    rate: bank.rate,
    durationMonths: months,
    startDate: Date.now(),
    maturityDate: Date.now() + (months * 30 * 24 * 60 * 60 * 1000), // Approx months
    projectedReturn: interest,
    status: 'active'
  };

  const investments = getInvestments();
  investments.push(investment);
  saveInvestments(investments);

  // Log the debit - This handles the deduction from totalPoints via addLogEntry logic
  addLogEntry({
    id: Date.now().toString(),
    childId,
    description: `Invested in ${bank.name} FD (${months} mo)`,
    points: -amount, 
    timestamp: Date.now(),
    category: 'investment'
  });
};

export const withdrawInvestment = (investmentId: string) => {
  const investments = getInvestments();
  const invIndex = investments.findIndex(i => i.id === investmentId);
  if (invIndex === -1) return;
  
  const inv = investments[invIndex];
  if (inv.status !== 'active') return;

  // Mark as withdrawn early
  investments[invIndex].status = 'early_withdrawn';
  saveInvestments(investments);

  const banks = getBanks();
  const bank = banks.find(b => b.id === inv.bankId);

  // Refund Principal ONLY. Interest is forfeited.
  addLogEntry({
    id: Date.now().toString(),
    childId: inv.childId,
    description: `Early FD Withdrawal: ${bank?.name || 'Bank'}`,
    points: inv.principal, // Only principal returned
    timestamp: Date.now(),
    category: 'investment'
  });
};

export const checkMaturedInvestments = () => {
  const investments = getInvestments();
  let hasChanges = false;
  const now = Date.now();
  const banks = getBanks();

  investments.forEach(inv => {
    if (inv.status === 'active' && now >= inv.maturityDate) {
      // Mature it
      inv.status = 'completed';
      hasChanges = true;

      const totalPayout = inv.principal + inv.projectedReturn;
      const bank = banks.find(b => b.id === inv.bankId);

      // Add Log + Credit Points
      addLogEntry({
        id: Date.now().toString() + Math.random(),
        childId: inv.childId,
        description: `FD Maturity: ${bank?.name || 'Bank'}`,
        points: totalPayout,
        timestamp: now,
        category: 'investment'
      });
    }
  });

  if (hasChanges) {
    saveInvestments(investments);
  }
};

export const deleteChildData = (childId: string) => {
  let children = getChildren();
  let logs = getLogs();
  let investments = getInvestments();

  children = children.filter(c => c.id !== childId);
  logs = logs.filter(l => l.childId !== childId);
  investments = investments.filter(i => i.childId !== childId);

  saveChildren(children);
  saveLogs(logs);
  saveInvestments(investments);
};

export const getStoredApiKey = (): string | null => {
  return localStorage.getItem(API_KEY_KEY);
};

export const saveApiKey = (key: string) => {
  localStorage.setItem(API_KEY_KEY, key);
};

export const exportData = (): string => {
  const data = {
    children: getChildren(),
    logs: getLogs(),
    investments: getInvestments(),
    version: 1,
    exportedAt: new Date().toISOString()
  };
  return JSON.stringify(data, null, 2);
};

export const importData = (jsonStr: string): boolean => {
  try {
    const data = JSON.parse(jsonStr);
    
    // Basic structural validation
    if (!Array.isArray(data.children) || !Array.isArray(data.logs) || !Array.isArray(data.investments)) {
      alert("Invalid backup file format. Missing required data arrays.");
      return false;
    }

    // Save data (Overwrite)
    saveChildren(data.children);
    saveLogs(data.logs);
    saveInvestments(data.investments);
    
    return true;
  } catch (error) {
    console.error("Import error:", error);
    alert("Failed to parse backup file.");
    return false;
  }
};