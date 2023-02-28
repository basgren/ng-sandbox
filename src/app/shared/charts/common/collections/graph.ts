/**
 * Common interface for graph implementations.
 * N - data type for nodes
 * E - data type for edges
 */
export interface Graph<N, E> {

  /**
   * Adds node to a graph.
   * @param node Node to add.
   */
  addNode(node: N): void;

  /**
   * Adds directed edge with specified data between specified nodes. All nodes should already be present in the graph.
   * @param sourceNode Source node
   * @param targetNode Target node
   * @param edge Data to be associated with this edge.
   */
  addEdge(sourceNode: N, targetNode: N, edge: E): void;

  /**
   * Returns all nodes contained in the graph.
   */
  getNodes(): N[];

  /**
   * Returns all edges contained in the graph.
   */
  getEdges(): E[];

  /**
   * Returns all edges that touch specified node (both incoming and outgoing).
   * @params node Node which edges should be retrieved.
   */
  getEdgesOf(node: N): E[];

  /**
   * Returns all incoming edges of specified node.
   * @params node Node which edges should be retrieved.
   */
  getIncomingEdgesOf(node: N): E[];

  /**
   * Returns all outgoing edges of specified node.
   * @params node Node which edges should be retrieved.
   */
  getOutgoingEdgesOf(node: N): E[];

  /**
   * Returns source node of specified edge.
   * @param edge Edge which node should be retrieved.
   */
  getEdgeSource(edge: E): N;

  /**
   * Returns target node of specified edge.
   * @param edge Edge which node should be retrieved.
   */
  getEdgeTarget(edge: E): N;

  /**
   * Returns all nodes that have outgoing edges that has specified node as target.
   * @param node
   */
  getNodeSources(node: N): N[];

  /**
   * Returns all target nodes of specified node.
   * @param node
   */
  getNodeTargets(node: N): N[];

  /**
   * Returns the length of a longest path between each pair of nodes.
   */
  getDiameter(): number;

  /**
   * Returns number of edges between specified node and farthest root node.
   * @param node Node which depth should be calculated.
   */
  getMaxNodeDepth(node: N): number;

}
