import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const C = {
  page:'#080C14', panel:'#0E1420', card:'#141C2E', hover:'#1A2540',
  border:'#1E2D4A', border2:'#2A3F63', drag:'#FF6B2B',
  t0:'#F1F5FF', t1:'#B8C5E0', t2:'#7A8BAD', t3:'#445572',
}

export default function DragDropReorder({ 
  items = [], 
  onReorder, 
  renderItem, 
  placeholder = 'Drop items here',
  className = ''
}) {
  const [isDragging, setIsDragging] = useState(false)

  const onDragEnd = (result) => {
    setIsDragging(false)
    if (!result.destination) return

    const newItems = Array.from(items)
    const [moved] = newItems.splice(result.source.index, 1)
    newItems.splice(result.destination.index, 0, moved)
    
    onReorder(newItems)
  }

  return (
    <div className={className}>
      <DragDropContext onDragStart={() => setIsDragging(true)} onDragEnd={onDragEnd}>
        <Droppable droppableId="reorder-list">
          {(provided, snapshot) => (
            <div 
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{
                minHeight: 40,
                background: isDragging ? C.hover : C.card,
                border: `1px solid ${isDragging ? C.drag : C.border}`,
                borderRadius: 12,
                transition: 'all 0.2s',
                ...provided.droppableProps.style
              }}
            >
              {items.length === 0 ? (
                <div style={{
                  padding: 24,
                  textAlign: 'center',
                  color: C.t2,
                  fontSize: 14
                }}>
                  {placeholder}
                </div>
              ) : (
                items.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                          ...provided.draggableProps.style,
                          background: snapshot.isDragging ? `${C.drag}20` : C.card,
                          border: `1px solid ${snapshot.isDragging ? C.drag : C.border2}`,
                          borderRadius: 10,
                          margin: '6px 12px',
                          boxShadow: snapshot.isDragging ? `0 8px 24px ${C.drag}40` : 'none',
                          transform: snapshot.isDragging ? 'rotate(2deg)' : 'none'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 16px',
                          gap: 12
                        }}>
                          <div 
                            {...provided.dragHandleProps}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: `${C.drag}20`,
                              border: `2px dashed ${C.drag}60`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 14,
                              color: C.drag,
                              fontWeight: 700,
                              cursor: 'grab',
                              flexShrink: 0
                            }}
                          >
                            ☰
                          </div>
                          {renderItem(item, index)}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}

