import React, { useState, useEffect } from 'react'
import { useSocket } from './hooks/useSocket'
import { useMongo } from './hooks/useMongo'
import Button from './components/Button'
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  removeElements,
  isNode,
  Position,
} from 'react-flow-renderer';
import dagre from 'dagre';

interface DatabasesProps {
  databases: string[],
  getCollections: (database: string) => void
}
function Databases ({ databases, getCollections }: DatabasesProps) {
  return (
    <ul>Databases:
      {databases.map(db => {
        return (
            <li key={db} className="my-1">
              <Button type="primary" onClick={() => getCollections(db)}>{db}</Button>
            </li>
        )
      }
      )}
    </ul>
  )
}

interface CollectionsProps {
  database: string,
  collections: string[],
  getProperties: (database: string, collection: string) => void
}
function Collections ({ database, collections, getProperties }: CollectionsProps) {
  return (
    <ul>
      {collections.map(col => {
        return (
          <li key={col} className="my-1">
            <Button onClick={() => getProperties(database, col)}>
              {col}
            </Button>
          </li>)
      })
      }
    </ul>
  )
}

function App () {
  const { connected } = useSocket()
  const { mongoData, mongoQueries } = useMongo()
  const { database, databases, collection, collections, nodes } = mongoData
  const { getDatabases, getCollections, getProperties } = mongoQueries

  const [elements, setElements] = useState<any[]>([])

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const createElementLabel = (model: any, collection: string) => {
    let keys = Object.keys(model).filter(k => k !== 'id').sort()
    return (
      <div>
        <h1 className="text-lg">{collection}</h1>
        <ul>
          {keys.map(k => {
            return (
              <li key={k}>{k}: {model[k]}</li>
            )
          })}
        </ul>
      </div>
    )
  }

  const getLayoutedElements = (elements: any[]) => {
    dagreGraph.setGraph({ rankdir: 'LR' });
    elements.forEach((el) => {
      if (isNode(el)) {
        dagreGraph.setNode(el.id, { width: 150, height: 50 });
      } else {
        dagreGraph.setEdge(el.source, el.target);
      }
    });
    dagre.layout(dagreGraph);
    return elements.map((el:any) => {
      if (isNode(el)) {
        const nodeWithPosition = dagreGraph.node(el.id);
        el.targetPosition = Position.Left;
        el.sourcePosition = Position.Right;
        // unfortunately we need this little hack to pass a slighltiy different position
        // in order to notify react flow about the change
        el.position = {
          x: nodeWithPosition.x + Math.random() / 1000,
          y: nodeWithPosition.y,
        };
      }
      return el;
    });
  };

  const onLayout = React.useCallback(() => {
    const layoutedElements = getLayoutedElements(elements);
    setElements(layoutedElements);
  },[elements]);

  useEffect(() => {
    let colls = Object.keys(nodes[database] || {})
    if(colls && colls.length > 0) {
      let elems: any[] = []
      colls.forEach((coll, idx) => {
        let model: any = nodes[database][coll]
        if(model && model.id) {
          let elem = { id: model.id, data: { label: createElementLabel(model, coll) }, position: { x: (idx + 1) * 100, y: (idx + 1) * 100 } }
          let ref = Object.keys(model).find(k => (model[k] === 'ref'))
          if (typeof ref !== 'undefined') {
            if (colls.find(c => c === ref)) {
              let refId = nodes[database][ref].id
              let edge = { id: `e${model.id}-${refId}`, source: model.id, target: refId, animated: true, arrowHeadType: 'arrowclosed', }
              elems.push(edge)
            }
          }
          elems.push(elem)
        }
      })
      setElements(elems)
    }

  }, [nodes, collection, database, setElements])

  return (
    <>
    <div className="w-screen h-screen p-4 grid grid-cols-3 gap-4">
      <div className="h-full relative">
        <div>
          {connected &&
            <p>WebSocket is Connected</p>
          }
          {database &&
            <p>Selected Database: {database}</p>
          }
          {collection &&
            <p>Selected Collection: {collection}</p>
          }
        </div>
        <div className="absolute bottom-0 left-0">
          <Button onClick={() => getDatabases()}>Get Databases</Button>
          <Button onClick={() => onLayout()}>Pretty Layout</Button>
        </div>
      </div>
      <div className="row-span-3 col-span-2">
        <ReactFlow snapToGrid={true} snapGrid={[15, 15]} elements={elements} />
      </div>
      <div className="m-0">
        {databases && databases.length > 0 &&
          <Databases databases={databases} getCollections={getCollections} />
        }
      </div>
      <div className="h-full">
        {database && collections && collections.length > 0 &&
          <Collections collections={collections} database={database} getProperties={getProperties}/>
        }
      </div>
    </div>
    </>
  )
}

export default App
