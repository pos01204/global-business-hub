/**
 * ECharts 타입 선언
 * echarts 및 echarts-for-react 패키지 타입 정의
 */

declare module 'echarts' {
  export interface EChartsOption {
    title?: any
    legend?: any
    tooltip?: any
    grid?: any
    xAxis?: any
    yAxis?: any
    series?: any[]
    color?: string[]
    animation?: boolean
    animationDuration?: number
    animationEasing?: string
    dataZoom?: any[]
    visualMap?: any
    radar?: any
    graphic?: any[]
    [key: string]: any
  }

  export interface ECharts {
    setOption(option: EChartsOption, notMerge?: boolean, lazyUpdate?: boolean): void
    getOption(): EChartsOption
    resize(opts?: { width?: number; height?: number }): void
    dispatchAction(payload: any): void
    on(eventName: string, handler: (params: any) => void): void
    off(eventName: string, handler?: (params: any) => void): void
    dispose(): void
    clear(): void
    getDom(): HTMLElement
    getWidth(): number
    getHeight(): number
    isDisposed(): boolean
    showLoading(type?: string, opts?: any): void
    hideLoading(): void
  }

  export function init(
    dom: HTMLElement | null,
    theme?: string | object,
    opts?: { renderer?: 'canvas' | 'svg'; width?: number; height?: number }
  ): ECharts

  export function registerTheme(themeName: string, theme: object): void
}

declare module 'echarts-for-react' {
  import { Component } from 'react'
  import type { EChartsOption, ECharts } from 'echarts'

  export interface ReactEChartsProps {
    option: EChartsOption
    style?: React.CSSProperties
    className?: string
    theme?: string | object
    opts?: {
      renderer?: 'canvas' | 'svg'
      width?: number | string
      height?: number | string
      devicePixelRatio?: number
    }
    notMerge?: boolean
    lazyUpdate?: boolean
    showLoading?: boolean
    loadingOption?: any
    onEvents?: Record<string, (params: any, chart: ECharts) => void>
    onChartReady?: (chart: ECharts) => void
  }

  export default class ReactECharts extends Component<ReactEChartsProps> {
    getEchartsInstance(): ECharts
  }
}

declare module 'simple-statistics' {
  export function mean(data: number[]): number
  export function median(data: number[]): number
  export function standardDeviation(data: number[]): number
  export function variance(data: number[]): number
  export function min(data: number[]): number
  export function max(data: number[]): number
  export function sum(data: number[]): number
  export function quantile(data: number[], p: number): number
  export function linearRegression(points: [number, number][]): { m: number; b: number }
  export function linearRegressionLine(mb: { m: number; b: number }): (x: number) => number
  export function rSquared(actual: number[], predicted: number[]): number
  export function sampleCorrelation(x: number[], y: number[]): number
}

