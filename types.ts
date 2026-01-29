
export interface User {
  username: string;
}

export interface OrgNode {
  id: string;
  name: string;
  employeeId: string;
  value: number; // The user input number
  children: string[]; // IDs of child nodes
  parentId: string | null;
}

export interface Project {
  id: string;
  title: string;
  rootNodeId: string;
  nodes: Record<string, OrgNode>;
  createdAt: number;
}
