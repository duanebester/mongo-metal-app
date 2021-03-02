/* eslint-disable no-case-declarations */
import React, { useEffect, useState } from 'react'
import { useSocket } from './useSocket'

type GetDatabases = {
    databases?: [string]
}

type GetCollections = {
    database: string
    collections?: [string]
}

type GetProperties = {
    database: string
    collection: string
    properties?: {
        results: Object[]
    }
}

type Event = {
    GetDatabases?: GetDatabases
    GetCollections?: GetCollections
    GetProperties?: GetProperties
}

type EventMessage = {
    kind: string
    event: Event
}

export const useMongo = () => {
  const [database, setDatabase] = useState<string>('')
  const [databases, setDatabases] = useState<string[]>([])
  const [collection, setCollection] = useState<string>('')
  const [collections, setCollections] = useState<string[]>([])

  const [nodes, setNodes] = React.useState<any>({})

  const { data, sendMessage } = useSocket()

  useEffect(() => {
    const eventMesage = data as EventMessage

    switch (eventMesage.kind) {
      case 'GetDatabases':
        const { databases } = eventMesage.event.GetDatabases as GetDatabases
        setDatabases(databases?.sort() || [])
        setCollections([])
        setNodes({})
        break
      case 'GetCollections':
        const { database, collections } = eventMesage.event.GetCollections as GetCollections
        setDatabase(database)
        setCollections(collections?.sort() || [])
        setCollection('')
        setNodes({})
        break
      case 'GetProperties':
        const props = eventMesage.event.GetProperties as GetProperties
        setCollection(props.collection)
        if (!nodes[props.database]) nodes[props.database] = {}
        if (props.properties && props.properties.results) {
          let elements = props.properties.results;
          console.log(elements);
          let element: any = {}
          elements.forEach((elem: any, i: number)=> {
            if((elem.value.values[0] as Object).hasOwnProperty('$ref')) {
              element[elem._id] = 'ref'
            } else {
              element[elem._id] = typeof elem.value.values[0]
            }
            element.id = i.toString()
          })
          nodes[props.database][props.collection] = element
          console.log(nodes[props.database])
        }
        break
      default:
        console.log(`Unknown Event: ${JSON.stringify(eventMesage)}`)
    }
  }, [data])

  const getDatabases = React.useCallback(() => {
    const event: EventMessage = { kind: 'GetDatabases', event: { GetDatabases: {} } }
    sendMessage(event)
  }, [])

  const getCollections = React.useCallback((database: string) => {
    const event: EventMessage = { kind: 'GetCollections', event: { GetCollections: { database } } }
    sendMessage(event)
  }, [])

  const getProperties = React.useCallback((database: string, collection: string) => {
    const event: EventMessage = { kind: 'GetProperties', event: { GetProperties: { database, collection } } }
    sendMessage(event)
  }, [])

  const mongoData = { database, databases, collection, collections, nodes }
  const mongoQueries = { getDatabases, getCollections, getProperties }

  return { mongoData, mongoQueries }
}
