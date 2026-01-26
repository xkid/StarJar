import { Child, ActivityLog } from '../types';

const KIDS_KEY = 'starjar_kids';
const LOGS_KEY = 'starjar_logs';

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

export const deleteChildData = (childId: string) => {
  let children = getChildren();
  let logs = getLogs();

  children = children.filter(c => c.id !== childId);
  logs = logs.filter(l => l.childId !== childId);

  saveChildren(children);
  saveLogs(logs);
};
