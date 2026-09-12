import flowcharts from "./marketing-flowcharts.json";

export type ImportedNodeKind = "start" | "activity" | "decision" | "evidence" | "exception" | "end";

export type ImportedFlowNode = {
  id: string;
  kind: ImportedNodeKind;
  label: string;
  role: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  fill: string;
  stroke: string;
  textColor: string;
};

export type ImportedFlowEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  route: "normal" | "return";
  sourceHandle: "left" | "right" | "bottom";
};

export type MarketingFlowchart = {
  code: string;
  sourceId: string;
  subareaCode: string;
  subareaName: string;
  owner: string;
  title: string;
  description: string;
  canvas: { width: number; height: number };
  nodes: ImportedFlowNode[];
  edges: ImportedFlowEdge[];
};

export const marketingFlowcharts = flowcharts as MarketingFlowchart[];

export function getMarketingFlowcharts(subareaCode: string) {
  return marketingFlowcharts.filter((flowchart) => flowchart.subareaCode === subareaCode);
}
