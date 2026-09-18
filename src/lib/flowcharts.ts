import marketingData from "./marketing-flowcharts.json";
import salesData from "./sales-flowcharts.json";
import commercialLeaderData from "./commercial-leader-flowcharts.json";
import administrationData from "./administration-detailed-flowcharts";
import financeData from "./finance-flowcharts.json";
import logisticsData from "./logistics-flowcharts";
import managementAssistantData from "./management-assistant-flowcharts";
import collectionsData from "./collections-flowcharts";
import type { MarketingFlowchart } from "./marketing-flowcharts";

export type Flowchart = MarketingFlowchart;

export const flowcharts = [...marketingData, ...salesData, ...commercialLeaderData, ...administrationData, ...financeData, ...logisticsData, ...managementAssistantData, ...collectionsData] as Flowchart[];

export function getFlowchartVersion(flowchart: Flowchart) {
  if (flowchart.code.startsWith("MKT-")) return "3.0";
  if (flowchart.code.startsWith("COM-LC-")) return "3.0";
  if (flowchart.code.startsWith("COM-")) return "2.0";
  return "1.0";
}

export function getFlowcharts(subareaCode: string) {
  return flowcharts.filter((flowchart) => flowchart.subareaCode === subareaCode);
}

export function getAreaFlowcharts(areaCode: string) {
  return flowcharts.filter((flowchart) => flowchart.subareaCode.startsWith(`${areaCode}-`));
}
