'use client'

import { useEffect, useRef } from 'react'

interface NetworkNode {
  id: string
  name: string
  title: string
  type: 'main' | 'recommendation' | 'alsoViewed'
  relationship?: string
  followers?: number
}

interface NetworkLink {
  source: string
  target: string
  type: 'recommendation' | 'alsoViewed'
  strength: number
}

interface NetworkVisualizationProps {
  profileData: any
}

export default function NetworkVisualization({ profileData }: NetworkVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!profileData || !svgRef.current) return

    const svg = svgRef.current
    const width = svg.clientWidth
    const height = svg.clientHeight
    const centerX = width / 2
    const centerY = height / 2

    // Clear previous content
    svg.innerHTML = ''

    // Create main node
    const mainNode: NetworkNode = {
      id: 'main',
      name: profileData.display_name,
      title: profileData.job_title,
      type: 'main'
    }

    // Create recommendation nodes
    const recommendationNodes: NetworkNode[] = (profileData.recommendations || [])
      .slice(0, 6)
      .map((rec: any, idx: number) => ({
        id: `rec-${idx}`,
        name: rec.recommender_name || 'Anonymous',
        title: rec.recommender_title || '',
        type: 'recommendation' as const,
        relationship: extractRelationshipType(rec.text || rec.recommendation)
      }))

    // Create also viewed nodes
    const alsoViewedNodes: NetworkNode[] = (profileData.also_viewed || [])
      .slice(0, 8)
      .map((person: any, idx: number) => ({
        id: `av-${idx}`,
        name: `${person.first_name} ${person.last_name}`,
        title: person.headline?.substring(0, 50) + '...' || '',
        type: 'alsoViewed' as const,
        followers: person.follower_count
      }))

    // Position nodes
    const positions = new Map<string, { x: number, y: number }>()
    
    // Main node at center
    positions.set('main', { x: centerX, y: centerY })
    
    // Recommendations in inner circle
    recommendationNodes.forEach((node, idx) => {
      const angle = (idx * 2 * Math.PI) / recommendationNodes.length
      const radius = 120
      positions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      })
    })
    
    // Also viewed in outer circle
    alsoViewedNodes.forEach((node, idx) => {
      const angle = (idx * 2 * Math.PI) / alsoViewedNodes.length + Math.PI / 8
      const radius = 200
      positions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      })
    })

    // Create SVG elements
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    svg.appendChild(g)

    // Draw links
    recommendationNodes.forEach(node => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      const mainPos = positions.get('main')!
      const nodePos = positions.get(node.id)!
      
      line.setAttribute('x1', mainPos.x.toString())
      line.setAttribute('y1', mainPos.y.toString())
      line.setAttribute('x2', nodePos.x.toString())
      line.setAttribute('y2', nodePos.y.toString())
      line.setAttribute('stroke', '#9333ea')
      line.setAttribute('stroke-width', '2')
      line.setAttribute('opacity', '0.6')
      
      g.appendChild(line)
    })

    alsoViewedNodes.forEach(node => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      const mainPos = positions.get('main')!
      const nodePos = positions.get(node.id)!
      
      line.setAttribute('x1', mainPos.x.toString())
      line.setAttribute('y1', mainPos.y.toString())
      line.setAttribute('x2', nodePos.x.toString())
      line.setAttribute('y2', nodePos.y.toString())
      line.setAttribute('stroke', '#3b82f6')
      line.setAttribute('stroke-width', '1')
      line.setAttribute('stroke-dasharray', '5,5')
      line.setAttribute('opacity', '0.3')
      
      g.appendChild(line)
    })

    // Draw nodes
    const drawNode = (node: NetworkNode) => {
      const pos = positions.get(node.id)!
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      
      // Circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', pos.x.toString())
      circle.setAttribute('cy', pos.y.toString())
      circle.setAttribute('r', node.type === 'main' ? '30' : '20')
      circle.setAttribute('fill', 
        node.type === 'main' ? '#7c3aed' : 
        node.type === 'recommendation' ? '#9333ea' : 
        '#3b82f6'
      )
      circle.setAttribute('opacity', node.type === 'main' ? '1' : '0.8')
      circle.setAttribute('style', 'cursor: pointer')
      
      // Text
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('x', pos.x.toString())
      text.setAttribute('y', (pos.y + 35).toString())
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('font-size', node.type === 'main' ? '14' : '11')
      text.setAttribute('fill', '#374151')
      text.textContent = node.name.split(' ')[0] // First name only
      
      // Relationship label for recommendations
      if (node.type === 'recommendation' && node.relationship) {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        label.setAttribute('x', pos.x.toString())
        label.setAttribute('y', (pos.y - 25).toString())
        label.setAttribute('text-anchor', 'middle')
        label.setAttribute('font-size', '9')
        label.setAttribute('fill', '#6b7280')
        label.textContent = node.relationship
        group.appendChild(label)
      }
      
      group.appendChild(circle)
      group.appendChild(text)
      
      // Tooltip
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
      title.textContent = `${node.name}\n${node.title}`
      group.appendChild(title)
      
      g.appendChild(group)
    }

    // Draw all nodes
    drawNode(mainNode)
    recommendationNodes.forEach(drawNode)
    alsoViewedNodes.forEach(drawNode)

    // Add legend
    const legend = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    legend.setAttribute('transform', 'translate(10, 20)')
    
    const legendItems = [
      { color: '#9333ea', text: 'Verified Relationships', y: 0 },
      { color: '#3b82f6', text: 'Network Clusters', y: 20 }
    ]
    
    legendItems.forEach(item => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', '10')
      circle.setAttribute('cy', item.y.toString())
      circle.setAttribute('r', '6')
      circle.setAttribute('fill', item.color)
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('x', '25')
      text.setAttribute('y', (item.y + 4).toString())
      text.setAttribute('font-size', '12')
      text.setAttribute('fill', '#4b5563')
      text.textContent = item.text
      
      legend.appendChild(circle)
      legend.appendChild(text)
    })
    
    svg.appendChild(legend)

  }, [profileData])

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      viewBox="0 0 600 400"
      style={{ background: '#f9fafb' }}
    />
  )
}

function extractRelationshipType(text: string): string {
  const lower = text?.toLowerCase() || ''
  if (lower.includes('managed directly') || lower.includes('direct report')) return 'Manager'
  if (lower.includes('reported to') || lower.includes('my manager')) return 'Subordinate'
  if (lower.includes('worked with') || lower.includes('collaborated')) return 'Peer'
  if (lower.includes('mentored') || lower.includes('coached')) return 'Mentor'
  if (lower.includes('client') || lower.includes('customer')) return 'Client'
  return 'Colleague'
}