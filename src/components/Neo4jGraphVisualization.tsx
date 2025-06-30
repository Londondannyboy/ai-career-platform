'use client'

import { useEffect, useRef, useState } from 'react'
import { Network, DataSet } from 'vis-network/standalone'

interface Neo4jGraphProps {
  data: any
  height?: string
}

export default function Neo4jGraphVisualization({ data, height = '600px' }: Neo4jGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [network, setNetwork] = useState<Network | null>(null)

  useEffect(() => {
    if (!containerRef.current || !data) return

    // Create nodes and edges from Neo4j data
    const nodes = new DataSet<any>([])
    const edges = new DataSet<any>([])
    
    // Add main person/company node
    if (data.person) {
      nodes.add({
        id: 'main',
        label: data.person.displayName || data.person.name,
        title: `${data.person.jobTitle}\n${data.person.currentCompany}`,
        group: 'main',
        size: 30,
        font: { size: 16, color: '#ffffff' }
      })
      
      // Add company node if exists
      if (data.company) {
        nodes.add({
          id: 'company',
          label: data.company.name,
          title: `${data.company.industry}\n${data.company.employees} employees`,
          group: 'company',
          size: 25
        })
        edges.add({
          from: 'main',
          to: 'company',
          label: 'WORKS_AT',
          color: { color: '#10b981' }
        })
      }
      
      // Add recommendation nodes
      if (data.relationships?.recommendations) {
        data.relationships.recommendations.forEach((rec: any, idx: number) => {
          const nodeId = `rec-${idx}`
          nodes.add({
            id: nodeId,
            label: rec.node.properties.name,
            title: rec.node.properties.title || 'No title',
            group: 'recommendation',
            size: 20
          })
          edges.add({
            from: nodeId,
            to: 'main',
            label: rec.relationship.properties.relationshipType || 'RECOMMENDS',
            color: { color: '#9333ea' },
            arrows: 'to'
          })
        })
      }
      
      // Add network cluster nodes
      if (data.relationships?.networkClusters) {
        data.relationships.networkClusters.forEach((cluster: any, idx: number) => {
          const nodeId = `cluster-${idx}`
          nodes.add({
            id: nodeId,
            label: cluster.node.properties.firstName || cluster.node.properties.name,
            title: cluster.node.properties.headline || 'No headline',
            group: 'network',
            size: 15
          })
          edges.add({
            from: 'main',
            to: nodeId,
            label: 'NETWORK',
            color: { color: '#3b82f6', opacity: 0.5 },
            dashes: true
          })
        })
      }
    } else if (data.company) {
      // Company-centric graph
      nodes.add({
        id: 'main',
        label: data.company.name,
        title: `${data.company.industry}\n${data.company.employees} employees`,
        group: 'company',
        size: 30,
        font: { size: 16, color: '#ffffff' }
      })
      
      // Add location nodes
      if (data.locations) {
        data.locations.forEach((loc: any, idx: number) => {
          const nodeId = `loc-${idx}`
          nodes.add({
            id: nodeId,
            label: loc.name,
            group: 'location',
            size: 15
          })
          edges.add({
            from: 'main',
            to: nodeId,
            label: 'LOCATED_IN',
            color: { color: '#f59e0b' }
          })
        })
      }
      
      // Add employee nodes
      if (data.employees) {
        data.employees.forEach((emp: any, idx: number) => {
          const nodeId = `emp-${idx}`
          nodes.add({
            id: nodeId,
            label: emp.name?.split(' ')[0] || 'Employee',
            title: emp.title || 'No title',
            group: 'employee',
            size: 20,
            image: emp.profileImage
          })
          edges.add({
            from: nodeId,
            to: 'main',
            label: 'WORKS_AT',
            color: { color: '#10b981' },
            arrows: 'to'
          })
        })
      }
    }

    // Network options
    const options: any = {
      nodes: {
        shape: 'dot',
        font: {
          size: 12,
          color: '#374151'
        }
      },
      edges: {
        font: {
          size: 10,
          color: '#6b7280'
        },
        smooth: {
          enabled: true,
          type: 'curvedCW',
          roundness: 0.2
        }
      },
      groups: {
        main: {
          color: {
            background: '#7c3aed',
            border: '#6d28d9'
          }
        },
        company: {
          color: {
            background: '#2563eb',
            border: '#1d4ed8'
          },
          shape: 'box'
        },
        recommendation: {
          color: {
            background: '#9333ea',
            border: '#7c3aed'
          }
        },
        network: {
          color: {
            background: '#60a5fa',
            border: '#3b82f6'
          }
        },
        location: {
          color: {
            background: '#f59e0b',
            border: '#d97706'
          },
          shape: 'triangle'
        },
        employee: {
          color: {
            background: '#10b981',
            border: '#059669'
          },
          shape: 'circularImage',
          borderWidth: 2
        }
      },
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.3,
          springLength: 150,
          springConstant: 0.04,
          damping: 0.09
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200
      }
    }

    // Create network
    const net = new Network(containerRef.current, { nodes, edges }, options)
    setNetwork(net)

    // Stabilize and fit
    net.once('stabilizationIterationsDone', () => {
      net.fit({ animation: true })
    })

    return () => {
      net.destroy()
    }
  }, [data])

  return (
    <div 
      ref={containerRef} 
      style={{ height, width: '100%', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
    />
  )
}