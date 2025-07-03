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
  const [focusedEmployee, setFocusedEmployee] = useState<string | null>(null)
  const [originalData, setOriginalData] = useState<any>(null)

  useEffect(() => {
    if (!containerRef.current || !data) return

    console.log('🎯 Neo4j Graph received data:', data)
    
    // Store original data for zoom out functionality
    if (!originalData) {
      setOriginalData(data)
    }

    // Create nodes and edges from company data
    const nodes = new DataSet<any>([])
    const edges = new DataSet<any>([])
    
    try {
      // Add company node at center
      if (data.company) {
        nodes.add({
          id: 'company',
          label: data.company.name,
          title: `${data.company.name}\n${data.company.employees} employees\n${data.company.totalRecommendations} recommendations`,
          group: 'company',
          size: 50,
          font: { size: 20, color: '#ffffff' },
          color: { background: '#1f2937', border: '#374151' },
          shape: 'box'
        })
      }

      // Add department nodes
      if (data.relationships?.departments) {
        Object.keys(data.relationships.departments).forEach((deptName) => {
          const deptId = `dept-${deptName.replace(/\s+/g, '-').toLowerCase()}`
          nodes.add({
            id: deptId,
            label: deptName,
            title: `${deptName} Department\n${data.relationships.departments[deptName].length} people`,
            group: 'department',
            size: 30,
            font: { size: 14, color: '#ffffff' },
            color: { background: '#3b82f6', border: '#1d4ed8' },
            shape: 'ellipse'
          })

          // Connect department to company
          edges.add({
            from: 'company',
            to: deptId,
            label: 'HAS_DEPARTMENT',
            color: { color: '#6b7280' },
            width: 2
          })
        })
      }

      // Add employee nodes
      if (data.employees) {
        data.employees.forEach((emp: any, idx: number) => {
          const empId = `emp-${idx}`
          const hasValidImage = emp.profileImage && 
            emp.profileImage.startsWith('http') && 
            emp.profileImage !== ''
          
          // Determine department for positioning
          const deptName = emp.department || 'Other'
          const deptId = `dept-${deptName.replace(/\s+/g, '-').toLowerCase()}`
          
          // Determine if this employee should be highlighted or dimmed
          const isFocused = focusedEmployee === empId
          const isConnectedToFocused = focusedEmployee ? 
            data.relationships?.recommendations?.some((rec: any) => 
              rec.from === emp.name || rec.to === emp.name
            ) : false
          const shouldDim = focusedEmployee && !isFocused && !isConnectedToFocused

          nodes.add({
            id: empId,
            label: emp.name,
            title: `${emp.name}\n${emp.title}\n${emp.department || 'Other'}\n\n👆 Click to focus/expand • Ctrl+Click for profile`,
            group: 'employee',
            size: isFocused ? 35 : (shouldDim ? 20 : 25),
            font: { 
              size: isFocused ? 14 : (shouldDim ? 10 : 12), 
              color: shouldDim ? '#9ca3af' : '#000000' 
            },
            color: { 
              background: isFocused ? '#ef4444' : (shouldDim ? '#e5e7eb' : getSeniorityColor(emp.seniority)), 
              border: isFocused ? '#dc2626' : '#374151',
              hover: { background: '#fbbf24', border: '#f59e0b' }
            },
            shape: hasValidImage ? 'circularImage' : 'dot',
            image: hasValidImage ? emp.profileImage : undefined,
            opacity: shouldDim ? 0.3 : 1,
            chosen: {
              node: (values: any, id: string, selected: boolean, hovering: boolean) => {
                if (hovering) {
                  values.color = '#fbbf24'
                  values.borderColor = '#f59e0b'
                  values.borderWidth = 3
                }
              }
            }
          })

          // Connect employee to department
          edges.add({
            from: deptId,
            to: empId,
            label: 'EMPLOYS',
            color: { color: '#9ca3af' },
            width: 1
          })
        })
      }

      // Add recommendation edges (relationships between employees)
      if (data.relationships?.recommendations) {
        data.relationships.recommendations.forEach((rec: any) => {
          // Find employee nodes by name
          const fromEmp = data.employees?.find((emp: any) => emp.name === rec.from)
          const toEmp = data.employees?.find((emp: any) => emp.name === rec.to)
          
          if (fromEmp && toEmp) {
            const fromIdx = data.employees.indexOf(fromEmp)
            const toIdx = data.employees.indexOf(toEmp)
            
            // Highlight recommendation edges when focusing on connected employees
            const isRelevantToFocus = focusedEmployee && 
              (focusedEmployee === `emp-${fromIdx}` || focusedEmployee === `emp-${toIdx}`)
            
            edges.add({
              from: `emp-${fromIdx}`,
              to: `emp-${toIdx}`,
              label: 'RECOMMENDS',
              color: { color: isRelevantToFocus ? '#ef4444' : '#10b981' },
              width: isRelevantToFocus ? 5 : 3,
              arrows: 'to',
              dashes: false,
              title: rec.context || 'LinkedIn recommendation',
              opacity: focusedEmployee && !isRelevantToFocus ? 0.2 : 1
            })
          }
        })
      }

      console.log(`✅ Created ${nodes.length} nodes and ${edges.length} edges`)

      // Network options
      const options = {
        nodes: {
          borderWidth: 2,
          shadow: true,
          font: {
            size: 12,
            face: 'arial'
          }
        },
        edges: {
          width: 2,
          shadow: true,
          smooth: {
            enabled: true,
            type: 'continuous',
            roundness: 0.2
          },
          font: {
            size: 10,
            align: 'middle'
          }
        },
        physics: {
          enabled: true,
          stabilization: { iterations: 100 },
          barnesHut: {
            gravitationalConstant: -8000,
            centralGravity: 0.3,
            springLength: 95,
            springConstant: 0.04,
            damping: 0.09
          }
        },
        layout: {
          improvedLayout: true,
          hierarchical: {
            enabled: false
          }
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          dragNodes: true,
          dragView: true,
          zoomView: true,
          hoverConnectedEdges: false
        },
        groups: {
          company: {
            color: { background: '#1f2937', border: '#374151' },
            font: { color: 'white', size: 20 }
          },
          department: {
            color: { background: '#3b82f6', border: '#1d4ed8' },
            font: { color: 'white', size: 14 }
          },
          employee: {
            color: { background: '#f3f4f6', border: '#374151' },
            font: { color: 'black', size: 12 }
          }
        }
      }

      // Create network
      const networkInstance = new Network(
        containerRef.current,
        { nodes, edges },
        options
      )

      // Event handlers
      networkInstance.on('click', (event) => {
        if (event.nodes.length > 0) {
          const nodeId = event.nodes[0]
          const node = nodes.get(nodeId)
          console.log('Node clicked:', node)
          
          // Handle employee node clicks
          if (nodeId.startsWith('emp-')) {
            const empIndex = parseInt(nodeId.replace('emp-', ''))
            const employee = data.employees?.[empIndex]
            
            // Check if Ctrl/Cmd key is pressed for navigation
            if (event.event.srcEvent && (event.event.srcEvent.ctrlKey || event.event.srcEvent.metaKey)) {
              // Navigate to employee page
              if (employee && employee.linkedinUrl) {
                const encodedUrl = encodeURIComponent(employee.linkedinUrl)
                console.log('Navigating to employee:', employee.name, 'URL:', `/employee/${encodedUrl}`)
                window.open(`/employee/${encodedUrl}`, '_blank')
              } else {
                console.log('Employee LinkedIn URL not found for:', employee?.name || 'Unknown employee')
              }
            } else {
              // Toggle focus on this employee (in-graph expansion)
              if (focusedEmployee === nodeId) {
                // If already focused, unfocus (zoom out)
                setFocusedEmployee(null)
                console.log('Unfocusing employee, showing full graph')
              } else {
                // Focus on this employee
                setFocusedEmployee(nodeId)
                console.log('Focusing on employee:', employee?.name || 'Unknown employee')
              }
            }
          } else {
            // Clicking on non-employee nodes unfocuses
            setFocusedEmployee(null)
          }
        } else {
          // Clicking on empty space unfocuses
          setFocusedEmployee(null)
        }
      })

      // Change cursor on hover
      networkInstance.on('hoverNode', (event) => {
        const nodeId = event.node
        if (nodeId.startsWith('emp-')) {
          if (containerRef.current) {
            containerRef.current.style.cursor = 'pointer'
          }
        }
      })

      networkInstance.on('blurNode', () => {
        if (containerRef.current) {
          containerRef.current.style.cursor = 'default'
        }
      })

      setNetwork(networkInstance)

      // Cleanup
      return () => {
        if (networkInstance) {
          networkInstance.destroy()
        }
      }

    } catch (error) {
      console.error('Error creating Neo4j visualization:', error)
    }
  }, [data, height, focusedEmployee])

  // Helper function to get color based on seniority
  function getSeniorityColor(seniority: string): string {
    switch (seniority?.toLowerCase()) {
      case 'senior':
      case 'lead':
      case 'principal':
        return '#ef4444' // Red for senior
      case 'mid':
      case 'intermediate':
        return '#f59e0b' // Orange for mid-level
      case 'junior':
      case 'entry':
        return '#22c55e' // Green for junior
      case 'director':
      case 'head':
      case 'vp':
        return '#8b5cf6' // Purple for leadership
      default:
        return '#6b7280' // Gray for unknown
    }
  }

  return (
    <div className="space-y-3">
      <div 
        ref={containerRef} 
        style={{ 
          height, 
          width: '100%',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          background: '#fafafa'
        }} 
      />
      
      {/* Show All button when an employee is focused */}
      {focusedEmployee && (
        <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <div className="flex items-center space-x-2 text-blue-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium">Focused on employee relationships</span>
          </div>
          <button
            onClick={() => setFocusedEmployee(null)}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
          >
            Show All
          </button>
        </div>
      )}
    </div>
  )
}