import { Graph } from './graph';

/**
 * Internal interface for storing information about directed edge.
 */
interface GraphEdge<N, E> {
  sourceNode: N;
  targetNode: N;
  edgeData: E;
}

interface NodeEdges<E> {
  incomingEdges: E[];
  outgoingEdges: E[];
}

export class DirectedGraph<N, E> implements Graph<N, E> {

  private nodes: Set<N> = new Set<N>();
  private edgeDataToEdges: Map<E, GraphEdge<N, E>> = new Map<E, GraphEdge<N, E>>();

  // Used for caching node level, as with increase of number of edges,
  // the performance drops drastically without caching.
  private nodeLevelMap: Map<N, number> = new Map<N, number>();
  private nodeEdgesMap: Map<N, NodeEdges<E>> = new Map<N, NodeEdges<E>>();

  addNode(node: N) {
    this.nodes.add(node);
  }

  addEdge(sourceNode: N, targetNode: N, edgeData: E) {
    // this.edges.push({edgeData, sourceNode, targetNode});
    this.edgeDataToEdges.set(edgeData, { edgeData, sourceNode, targetNode });
    this.clearCache();
  }

  getNodes(): N[] {
    return Array.from(this.nodes);
  }

  getNodesByDepth(depth: number): N[] {
    return this.getNodes().filter((node) => this.getMaxNodeDepth(node) === depth);
  }

  getEdges(): E[] {
    return Array.from(this.edgeDataToEdges.keys());
  }

  getEdgesOf(node: N): E[] {
    return this.filterEdges((edge: GraphEdge<N, E>) => {
      return edge.targetNode === node || edge.sourceNode === node;
    });
  }

  getIncomingEdgesOf(node: N): E[] {
    return this.getNodeEdges(node).incomingEdges;
  }

  getOutgoingEdgesOf(node: N): E[] {
    return this.getNodeEdges(node).outgoingEdges;
  }

  getEdgeSource(edgeData: E): N {
    return this.getEdgeFor(edgeData).sourceNode;
  }

  getEdgeTarget(edgeData: E): N {
    return this.getEdgeFor(edgeData).targetNode;
  }

  getNodeTargets(node: N): N[] {
    return this.getOutgoingEdgesOf(node).map(edge => this.getEdgeTarget(edge));
  }

  getNodeSources(node: N): N[] {
    return this.getIncomingEdgesOf(node).map(edge => this.getEdgeSource(edge));
  }

  getDiameter(): number {
    return this.getNodes().reduce((max: number, node: N) => {
      return Math.max(max, this.getMaxNodeDepth(node));
    }, 0);
  }

  getMaxNodeDepth(node: N): number {
    // Use cache for performance! Calculation time grows exponentially with increasing number of edges.
    const nodeLevel: number | undefined = this.nodeLevelMap.get(node);

    if (nodeLevel !== undefined) {
      return nodeLevel;
    }

    const parentNodes = this.getIncomingEdgesOf(node).map((edge: E) => this.getEdgeSource(edge));
    let level = 0;

    if (parentNodes.length > 0) {
      const pathLengths = parentNodes.map((parentNode: N) => this.getMaxNodeDepth(parentNode));
      level = Math.max(...pathLengths) + 1;
    }

    this.nodeLevelMap.set(node, level);

    return level;
  }

  private getEdgeFor(edgeData: E): GraphEdge<N, E> {
    const edge = this.edgeDataToEdges.get(edgeData);

    if (edge) {
      return edge;
    }

    throw new Error(`Edge not found for data: ${edgeData}`);
  }

  private getNodeEdges(node: N): NodeEdges<E> {
    let nodeEdges: NodeEdges<E> | undefined = this.nodeEdgesMap.get(node);

    if (!nodeEdges) {
      const incomingEdges = this.filterEdges((edge: GraphEdge<N, E>) => edge.targetNode === node);
      const outgoingEdges = this.filterEdges((edge: GraphEdge<N, E>) => edge.sourceNode === node);
      nodeEdges = { incomingEdges, outgoingEdges };
      this.nodeEdgesMap.set(node, nodeEdges);
    }

    return nodeEdges;
  }

  private filterEdges(callback: (edge: GraphEdge<N, E>) => boolean): E[] {
    return [...this.edgeDataToEdges.values()]
      .filter(callback)
      .map((edge) => edge.edgeData);
  }

  private clearCache(): void {
    this.nodeLevelMap.clear();
    this.nodeEdgesMap.clear();
  }

}
