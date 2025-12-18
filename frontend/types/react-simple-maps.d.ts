// 최소 타입 정의: 빌드 및 타입체크를 위한 선언
// 필요 시 점진적으로 구체 타입으로 확장 가능

declare module 'react-simple-maps' {
  import * as React from 'react'

  export interface ComposableMapProps extends React.SVGAttributes<SVGSVGElement> {
    projection?: string | ((...args: any[]) => any)
    projectionConfig?: Record<string, any>
    width?: number
    height?: number
    style?: React.CSSProperties
  }

  export const ComposableMap: React.ComponentType<ComposableMapProps>

  export interface GeographiesProps {
    geography: string | object
    children: (props: { geographies: any[] }) => React.ReactNode
  }

  export const Geographies: React.ComponentType<GeographiesProps>

  export interface GeographyProps extends React.SVGAttributes<SVGPathElement> {
    geography: any
    style?: Record<string, React.CSSProperties>
    onMouseEnter?: (event: React.MouseEvent<SVGPathElement, MouseEvent>) => void
    onMouseLeave?: (event: React.MouseEvent<SVGPathElement, MouseEvent>) => void
  }

  export const Geography: React.ComponentType<GeographyProps>

  export interface MarkerProps {
    coordinates: [number, number]
    children?: React.ReactNode
  }

  export const Marker: React.ComponentType<MarkerProps>

  export interface ZoomableGroupProps {
    center?: [number, number]
    zoom?: number
    children?: React.ReactNode
  }

  export const ZoomableGroup: React.ComponentType<ZoomableGroupProps>
}


