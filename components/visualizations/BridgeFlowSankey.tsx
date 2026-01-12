'use client'

import { useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'
import { sankey, sankeyLinkHorizontal } from 'd3-sankey'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/format'
import type { FlowData } from '@/lib/types'

interface BridgeFlowSankeyProps {
  data: FlowData
  loading?: boolean
  height?: number
}

export function BridgeFlowSankey({
  data,
  loading = false,
  height = 500,
}: BridgeFlowSankeyProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const sankeyData = useMemo(() => {
    if (!data?.nodes?.length || !data?.links?.length) return null

    // Create set of valid node IDs
    const nodeIds = new Set(data.nodes.map((n) => n.id))

    // Filter links to only include those with valid nodes and positive values
    const validLinks = data.links
      .filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target) && l.value > 0)
      .map((l) => ({
        source: l.source,
        target: l.target,
        value: l.value,
        color: l.color,
      }))

    if (validLinks.length === 0) return null

    // Only include nodes that have at least one link
    const usedNodeIds = new Set<string>()
    validLinks.forEach((l) => {
      usedNodeIds.add(l.source)
      usedNodeIds.add(l.target)
    })

    const usedNodes = data.nodes
      .filter((n) => usedNodeIds.has(n.id))
      .map((n) => ({
        id: n.id,
        name: n.name,
        color: n.color,
        value: n.value,
      }))

    if (usedNodes.length === 0) return null

    return {
      nodes: usedNodes as any[],
      links: validLinks as any[],
    }
  }, [data])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !sankeyData) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = containerRef.current.clientWidth
    const margin = { top: 20, right: 120, bottom: 20, left: 120 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Create sankey generator
    const sankeyGenerator = sankey()
      .nodeWidth(20)
      .nodePadding(15)
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .nodeId((d: any) => d.id)

    // Generate layout
    const { nodes, links } = sankeyGenerator({
      nodes: sankeyData.nodes.map((d: any) => ({ ...d })),
      links: sankeyData.links.map((d: any) => ({ ...d })),
    } as any)

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Create gradients for links
    const defs = svg.append('defs')

    links.forEach((link: any, i: number) => {
      const gradient = defs
        .append('linearGradient')
        .attr('id', `gradient-${i}`)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', link.source.x1)
        .attr('x2', link.target.x0)

      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', link.source.color || '#627EEA')

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', link.target.color || '#627EEA')
    })

    // Draw links
    const linkGroup = g
      .append('g')
      .attr('class', 'links')
      .attr('fill', 'none')
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('class', 'sankey-link')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (d: any, i: number) => `url(#gradient-${i})`)
      .attr('stroke-width', (d: any) => Math.max(2, d.width))
      .attr('stroke-opacity', 0.5)

    // Add link hover effect
    linkGroup
      .on('mouseover', function (event: MouseEvent, d: any) {
        d3.select(this).attr('stroke-opacity', 0.7)

        const tooltip = d3.select('#sankey-tooltip')
        tooltip
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(
            `<div class="font-medium">${d.source.name} → ${d.target.name}</div>
             <div class="text-muted-foreground">${formatCurrency(d.value)}</div>`
          )
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke-opacity', 0.3)
        d3.select('#sankey-tooltip').style('opacity', 0)
      })

    // Draw nodes
    const nodeGroup = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('rect')
      .data(nodes)
      .join('rect')
      .attr('class', 'sankey-node')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('height', (d: any) => Math.max(1, d.y1 - d.y0))
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('fill', (d: any) => d.color || '#627EEA')
      .attr('rx', 4)
      .attr('ry', 4)

    // Add node labels
    g.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('x', (d: any) => (d.x0 < innerWidth / 2 ? d.x0 - 6 : d.x1 + 6))
      .attr('y', (d: any) => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => (d.x0 < innerWidth / 2 ? 'end' : 'start'))
      .attr('font-size', '12px')
      .attr('fill', 'currentColor')
      .text((d: any) => d.name)

    // Add node value labels
    g.append('g')
      .attr('class', 'values')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('x', (d: any) => (d.x0 < innerWidth / 2 ? d.x0 - 6 : d.x1 + 6))
      .attr('y', (d: any) => (d.y1 + d.y0) / 2 + 14)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => (d.x0 < innerWidth / 2 ? 'end' : 'start'))
      .attr('font-size', '10px')
      .attr('fill', 'currentColor')
      .attr('opacity', 0.6)
      .text((d: any) => formatCurrency(d.value || 0))
  }, [sankeyData, height])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bridge Flows</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height }} />
        </CardContent>
      </Card>
    )
  }

  if (!sankeyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bridge Flows</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center text-muted-foreground"
            style={{ height }}
          >
            No flow data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cross-Chain Bridge Flows</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative">
          <svg ref={svgRef} width="100%" height={height} />
          <div
            id="sankey-tooltip"
            className="absolute pointer-events-none bg-background border rounded-lg px-3 py-2 shadow-lg text-sm opacity-0 transition-opacity z-50"
          />
        </div>
      </CardContent>
    </Card>
  )
}
