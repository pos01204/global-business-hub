'use client'

import React from 'react'
import { ResponsiveSankey } from '@nivo/sankey'
import { ResponsiveCalendar } from '@nivo/calendar'
import { ResponsiveSunburst } from '@nivo/sunburst'
import { ResponsiveHeatMap } from '@nivo/heatmap'
import { cn } from '@/lib/utils'

// ========================================
// 산키 다이어그램 (물류 파이프라인)
// ========================================

export interface SankeyNode {
  id: string
  label?: string
  color?: string
}

export interface SankeyLink {
  source: string
  target: string
  value: number
}

export interface SankeyData {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

export interface PipelineSankeyProps {
  data: SankeyData
  className?: string
  height?: number
  colors?: string[]
}

export function PipelineSankey({
  data,
  className,
  height = 400,
  colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
}: PipelineSankeyProps) {
  if (!data.nodes.length || !data.links.length) {
    return (
      <div className={cn('flex items-center justify-center text-slate-400', className)} style={{ height }}>
        데이터가 없습니다
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveSankey
        data={data}
        margin={{ top: 40, right: 160, bottom: 40, left: 50 }}
        align="justify"
        colors={colors}
        nodeOpacity={1}
        nodeHoverOthersOpacity={0.35}
        nodeThickness={18}
        nodeSpacing={24}
        nodeBorderWidth={0}
        nodeBorderRadius={3}
        linkOpacity={0.5}
        linkHoverOthersOpacity={0.1}
        linkContract={3}
        enableLinkGradient={true}
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={16}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1]] }}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  )
}

// ========================================
// 캘린더 히트맵 (일별 활동)
// ========================================

export interface CalendarDataPoint {
  day: string // YYYY-MM-DD 형식
  value: number
}

export interface ActivityCalendarProps {
  data: CalendarDataPoint[]
  from: string // YYYY-MM-DD
  to: string // YYYY-MM-DD
  className?: string
  height?: number
  emptyColor?: string
  colors?: string[]
  legendTitle?: string
}

export function ActivityCalendar({
  data,
  from,
  to,
  className,
  height = 200,
  emptyColor = '#f1f5f9',
  colors = ['#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5'],
  legendTitle = '활동',
}: ActivityCalendarProps) {
  if (!data.length) {
    return (
      <div className={cn('flex items-center justify-center text-slate-400', className)} style={{ height }}>
        데이터가 없습니다
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveCalendar
        data={data}
        from={from}
        to={to}
        emptyColor={emptyColor}
        colors={colors}
        margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
        yearSpacing={40}
        monthBorderColor="#ffffff"
        dayBorderWidth={2}
        dayBorderColor="#ffffff"
        legends={[
          {
            anchor: 'bottom-right',
            direction: 'row',
            translateY: 36,
            itemCount: 4,
            itemWidth: 42,
            itemHeight: 36,
            itemsSpacing: 14,
            itemDirection: 'right-to-left',
          },
        ]}
        tooltip={({ day, value }) => (
          <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg">
            <strong>{day}</strong>: {value} {legendTitle}
          </div>
        )}
      />
    </div>
  )
}

// ========================================
// 선버스트 차트 (계층 구조)
// ========================================

export interface SunburstDataNode {
  id: string
  value?: number
  children?: SunburstDataNode[]
  color?: string
}

export interface HierarchySunburstProps {
  data: SunburstDataNode
  className?: string
  height?: number
  colors?: string[]
  cornerRadius?: number
}

export function HierarchySunburst({
  data,
  className,
  height = 400,
  colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'],
  cornerRadius = 3,
}: HierarchySunburstProps) {
  if (!data.children?.length) {
    return (
      <div className={cn('flex items-center justify-center text-slate-400', className)} style={{ height }}>
        데이터가 없습니다
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveSunburst
        data={data}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        id="id"
        value="value"
        cornerRadius={cornerRadius}
        borderWidth={1}
        borderColor={{ from: 'color', modifiers: [['darker', 0.6]] }}
        colors={colors}
        childColor={{ from: 'color', modifiers: [['brighter', 0.3]] }}
        enableArcLabels={true}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
        animate={true}
        motionConfig="gentle"
        transitionMode="pushIn"
      />
    </div>
  )
}

// ========================================
// 히트맵 (코호트 분석)
// ========================================

export interface HeatMapDataPoint {
  id: string
  data: { x: string; y: number | null }[]
}

export interface CohortHeatMapProps {
  data: HeatMapDataPoint[]
  className?: string
  height?: number
  colors?: string[]
  valueFormat?: string
}

export function CohortHeatMap({
  data,
  className,
  height = 400,
  colors = ['#f1f5f9', '#c7d2fe', '#818cf8', '#4f46e5', '#3730a3'],
  valueFormat = '>-.2s',
}: CohortHeatMapProps) {
  if (!data.length) {
    return (
      <div className={cn('flex items-center justify-center text-slate-400', className)} style={{ height }}>
        데이터가 없습니다
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveHeatMap
        data={data}
        margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
        valueFormat={valueFormat}
        axisTop={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: '',
          legendOffset: 46,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: '코호트',
          legendPosition: 'middle',
          legendOffset: -72,
        }}
        colors={{
          type: 'sequential',
          scheme: 'purples',
        }}
        emptyColor="#f1f5f9"
        legends={[
          {
            anchor: 'bottom',
            translateX: 0,
            translateY: 30,
            length: 400,
            thickness: 8,
            direction: 'row',
            tickPosition: 'after',
            tickSize: 3,
            tickSpacing: 4,
            tickOverlap: false,
            title: '리텐션율 →',
            titleAlign: 'start',
            titleOffset: 4,
          },
        ]}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  )
}

// ========================================
// 물류 파이프라인 데이터 변환 헬퍼
// ========================================

export interface PipelineStage {
  name: string
  count: number
  criticalCount?: number
}

export function createPipelineSankeyData(stages: PipelineStage[]): SankeyData {
  const nodes: SankeyNode[] = stages.map((stage, index) => ({
    id: stage.name,
    label: `${stage.name} (${stage.count})`,
    color: stage.criticalCount && stage.criticalCount > 0 ? '#ef4444' : undefined,
  }))

  const links: SankeyLink[] = []
  for (let i = 0; i < stages.length - 1; i++) {
    const flowValue = Math.min(stages[i].count, stages[i + 1].count)
    if (flowValue > 0) {
      links.push({
        source: stages[i].name,
        target: stages[i + 1].name,
        value: flowValue,
      })
    }
  }

  return { nodes, links }
}

