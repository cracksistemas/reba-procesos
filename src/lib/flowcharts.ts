import marketingData from "./marketing-flowcharts.json";
import salesData from "./sales-flowcharts.json";
import type { MarketingFlowchart } from "./marketing-flowcharts";

export type Flowchart = MarketingFlowchart;

export const flowcharts = [...marketingData, ...salesData] as Flowchart[];

export function getFlowcharts(subareaCode: string) {
  return flowcharts.filter((flowchart) => flowchart.subareaCode === subareaCode);
}

export function getAreaFlowcharts(areaCode: string) {
  return flowcharts.filter((flowchart) => flowchart.subareaCode.startsWith(`${areaCode}-`));
}
