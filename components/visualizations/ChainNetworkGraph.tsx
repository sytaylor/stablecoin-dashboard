'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/format'
import type { NetworkData, NetworkNode, NetworkLink } from '@/lib/types'

interface ChainNetworkGraphProps {
  data: NetworkData
  loading?: boolean
  height?: number
}

export function ChainNetworkGraph({
  data,
  loading = false,
  height = 500,
}: ChainNetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data?.nodes?.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = containerRef.current.clientWidth
    const centerX = width / 2
    const centerY = height / 2

    // Scale node sizes based on value
    const maxValue = Math.max(...data.nodes.map((n) => n.value))
    const nodeScale = d3
      .scaleSqrt()
      .domain([0, maxValue])
      .range([10, 50])

    // Scale link widths based on value
    const maxLinkValue = Math.max(...data.links.map((l) => l.value))
    const linkScale = d3
      .scaleLinear()
      .domain([0, maxLinkValue])
      .range([1, 10])

    // Create simulation
    const simulation = d3
      .forceSimulation(data.nodes as d3.SimulationNodeDatum[])
      .force(
        'link',
        d3
          .forceLink(data.links)
          .id((d: any) => d.id)
          .distance(150)
      )
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(centerX, centerY))
      .force('collision', d3.forceCollide().radius((d: any) => nodeScale(d.value) + 10))

    // Create container groups
    const g = svg.append('g')

    // Add zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Create gradient for animated links
    const defs = svg.append('defs')

    // Animated flow pattern
    const pattern = defs
      .append('pattern')
      .attr('id', 'flow-pattern')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 20)
      .attr('height', 10)

    pattern
      .append('circle')
      .attr('cx', 5)
      .attr('cy', 5)
      .attr('r', 2)
      .attr('fill', 'currentColor')
      .attr('opacity', 0.5)

    // Draw links
    const links = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('class', 'network-link')
      .attr('stroke', '#888')
      .attr('stroke-width', (d: any) => linkScale(d.value))
      .attr('stroke-linecap', 'round')

    // Draw animated flow particles
    const flowPaths = g
      .append('g')
      .attr('class', 'flow-paths')
      .selectAll('path')
      .data(data.links.filter((l) => l.value > maxLinkValue * 0.1))
      .join('path')
      .attr('class', 'flow-path')
      .attr('fill', 'none')
      .attr('stroke', (d: any) => {
        const sourceNode = data.nodes.find(
          (n) => n.id === (typeof d.source === 'string' ? d.source : d.source.id)
        )
        return sourceNode?.color || '#627EEA'
      })
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.6)

    // Draw nodes
    const nodes = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(data.nodes)
      .join('g')
      .attr('class', 'network-node')
      .call(
        d3
          .drag<any, any>()
          .on('start', (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event: any, d: any) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event: any, d: any) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          }) as any
      )

    // Node circles
    nodes
      .append('circle')
      .attr('r', (d) => nodeScale(d.value))
      .attr('fill', (d) => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')

    // Node labels
    nodes
      .append('text')
      .text((d) => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => nodeScale(d.value) + 16)
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('fill', 'currentColor')

    // Node value labels
    nodes
      .append('text')
      .text((d) => formatCurrency(d.value))
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('font-size', '9px')
      .attr('font-weight', '600')
      .attr('fill', '#fff')

    // Hover effects
    nodes
      .on('mouseover', function (event, d) {
        d3.select(this).select('circle').attr('stroke-width', 4)
        setHoveredNode(d)

        // Highlight connected links
        links.attr('opacity', (l: any) =>
          l.source.id === d.id || l.target.id === d.id ? 1 : 0.2
        )
      })
      .on('mouseout', function () {
        d3.select(this).select('circle').attr('stroke-width', 2)
        setHoveredNode(null)
        links.attr('opacity', 0.4)
      })

    // Update positions on simulation tick
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      flowPaths.attr('d', (d: any) => {
        const dx = d.target.x - d.source.x
        const dy = d.target.y - d.source.y
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`
      })

      nodes.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [data, height])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chain Network</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height }} />
        </CardContent>
      </Card>
    )
  }

  if (!data?.nodes?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chain Network</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center text-muted-foreground"
            style={{ height }}
          >
            No network data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Chain Network Graph</CardTitle>
        {hoveredNode && (
          <div className="text-sm">
            <span className="font-medium">{hoveredNode.name}</span>
            <span className="text-muted-foreground ml-2">
              {formatCurrency(hoveredNode.value)}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative bg-muted/30 rounded-lg">
          <svg ref={svgRef} width="100%" height={height} />
          <div className="absolute bottom-4 left-4 text-xs text-muted-foreground">
            Drag to move nodes. Scroll to zoom.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
