import marketingData from "./marketing-flowcharts.json";
import salesData from "./sales-flowcharts.json";
import administrationData from "./administration-flowcharts.json";
import financeData from "./finance-flowcharts.json";
import type { MarketingFlowchart } from "./marketing-flowcharts";

export type Flowchart = MarketingFlowchart;

export const flowcharts = [...marketingData, ...salesData, ...administrationData, ...financeData] as Flowchart[];

export function getFlowchartVersion(flowchart: Flowchart) {
  if (flowchart.code.startsWith("MKT-")) return "3.0";
  if (flowchart.code.startsWith("COM-")) return "2.0";
  return "1.0";
}

export function getFlowcharts(subareaCode: string) {
  return flowcharts.filter((flowchart) => flowchart.subareaCode === subareaCode);
}

export function getAreaFlowcharts(areaCode: string) {
  return flowcharts.filter((flowchart) => flowchart.subareaCode.startsWith(`${areaCode}-`));
}
