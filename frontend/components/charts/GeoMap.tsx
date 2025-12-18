'use client'

import React, { useState, useMemo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps'
import { scaleLinear, scaleQuantize } from 'd3-scale'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'

// 세계 지도 GeoJSON URL (TopoJSON)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// ========================================
// 국가별 GMV 지도
// ========================================

export interface CountryData {
  iso: string // ISO 3166-1 alpha-3 코드
  name: string
  value: number
  lat?: number
  lng?: number
}

export interface CountryGMVMapProps {
  data: CountryData[]
  className?: string
  height?: number
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange'
  showMarkers?: boolean
  valueFormat?: (value: number) => string
  title?: string
  showLegend?: boolean
}

const colorSchemes = {
  blue: ['#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1', '#4F46E5'],
  green: ['#D1FAE5', '#A7F3D0', '#6EE7B7', '#34D399', '#10B981', '#059669'],
  purple: ['#F3E8FF', '#E9D5FF', '#D8B4FE', '#C084FC', '#A855F7', '#9333EA'],
  orange: ['#FFEDD5', '#FED7AA', '#FDBA74', '#FB923C', '#F97316', '#EA580C'],
}

export function CountryGMVMap({
  data,
  className,
  height = 500,
  colorScheme = 'blue',
  showMarkers = true,
  valueFormat = (v) => `₩${(v / 1000000).toFixed(1)}M`,
  title,
  showLegend = true,
}: CountryGMVMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null)
  
  const { colorScale, maxValue, dataMap } = useMemo(() => {
    const values = data.map(d => d.value).filter(v => v > 0)
    const max = Math.max(...values, 1)
    
    const scale = scaleQuantize<string>()
      .domain([0, max])
      .range(colorSchemes[colorScheme])
    
    const map = new Map(data.map(d => [d.iso, d]))
    
    return { colorScale: scale, maxValue: max, dataMap: map }
  }, [data, colorScheme])

  const markerScale = useMemo(() => {
    return scaleLinear()
      .domain([0, maxValue])
      .range([5, 25])
  }, [maxValue])

  if (!data.length) {
    return (
      <div className={cn('flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl', className)} style={{ height }}>
        지역 데이터가 없습니다
      </div>
    )
  }

  return (
    <div className={cn('relative bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden', className)} style={{ height }}>
      {title && (
        <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-slate-900/90 px-3 py-1.5 rounded-lg shadow-sm">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</span>
        </div>
      )}
      
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 140, center: [0, 30] }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const countryData = dataMap.get(geo.properties.ISO_A3)
                const fillColor = countryData ? colorScale(countryData.value) : '#F1F5F9'
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke="#CBD5E1"
                    strokeWidth={0.5}
                    onMouseEnter={() => {
                      if (countryData) setHoveredCountry(countryData)
                    }}
                    onMouseLeave={() => setHoveredCountry(null)}
                    style={{
                      default: { outline: 'none' },
                      hover: { 
                        fill: countryData ? '#818CF8' : '#E2E8F0',
                        outline: 'none',
                        cursor: countryData ? 'pointer' : 'default',
                      },
                      pressed: { outline: 'none' },
                    }}
                  />
                )
              })
            }
          </Geographies>
          
          {/* 마커 (주요 국가) */}
          {showMarkers && data.filter(d => d.lat && d.lng && d.value > 0).map(country => (
            <Marker key={country.iso} coordinates={[country.lng!, country.lat!]}>
              <circle
                r={markerScale(country.value)}
                fill="#EF4444"
                fillOpacity={0.7}
                stroke="#fff"
                strokeWidth={1.5}
                onMouseEnter={() => setHoveredCountry(country)}
                onMouseLeave={() => setHoveredCountry(null)}
                style={{ cursor: 'pointer' }}
              />
              <text
                textAnchor="middle"
                y={-markerScale(country.value) - 5}
                className="text-xs font-medium"
                style={{ fill: '#374151' }}
              >
                {country.name}
              </text>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>
      
      {/* 호버 툴팁 */}
      {hoveredCountry && (
        <div className="absolute bottom-4 right-4 bg-white dark:bg-slate-900 rounded-lg shadow-lg p-3 z-10">
          <p className="font-medium text-slate-800 dark:text-slate-200">{hoveredCountry.name}</p>
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {valueFormat(hoveredCountry.value)}
          </p>
        </div>
      )}
      
      {/* 범례 */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-900/90 rounded-lg shadow-sm p-2 z-10">
          <div className="flex items-center gap-1">
            {colorSchemes[colorScheme].map((color, i) => (
              <div
                key={i}
                className="w-6 h-3 rounded-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>₩0</span>
            <span>{valueFormat(maxValue)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ========================================
// 아시아 지역 지도 (주요 시장)
// ========================================

const ASIA_CENTER: [number, number] = [105, 25]

export interface AsiaRegionMapProps {
  data: CountryData[]
  className?: string
  height?: number
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange'
}

export function AsiaRegionMap({
  data,
  className,
  height = 400,
  colorScheme = 'orange',
}: AsiaRegionMapProps) {
  return (
    <CountryGMVMap
      data={data}
      className={className}
      height={height}
      colorScheme={colorScheme}
      title="아시아 주요 시장"
    />
  )
}

// ========================================
// 국가 코드 매핑 헬퍼
// ========================================

export const countryCodeMap: Record<string, { iso: string; lat: number; lng: number }> = {
  '일본': { iso: 'JPN', lat: 36.2048, lng: 138.2529 },
  '대만': { iso: 'TWN', lat: 23.6978, lng: 120.9605 },
  '미국': { iso: 'USA', lat: 37.0902, lng: -95.7129 },
  '싱가포르': { iso: 'SGP', lat: 1.3521, lng: 103.8198 },
  '홍콩': { iso: 'HKG', lat: 22.3193, lng: 114.1694 },
  '태국': { iso: 'THA', lat: 15.8700, lng: 100.9925 },
  '말레이시아': { iso: 'MYS', lat: 4.2105, lng: 101.9758 },
  '베트남': { iso: 'VNM', lat: 14.0583, lng: 108.2772 },
  '인도네시아': { iso: 'IDN', lat: -0.7893, lng: 113.9213 },
  '필리핀': { iso: 'PHL', lat: 12.8797, lng: 121.7740 },
  '호주': { iso: 'AUS', lat: -25.2744, lng: 133.7751 },
  '캐나다': { iso: 'CAN', lat: 56.1304, lng: -106.3468 },
  '영국': { iso: 'GBR', lat: 55.3781, lng: -3.4360 },
  '독일': { iso: 'DEU', lat: 51.1657, lng: 10.4515 },
  '프랑스': { iso: 'FRA', lat: 46.2276, lng: 2.2137 },
}

export function convertToCountryData(
  rawData: { country: string; value: number }[]
): CountryData[] {
  return rawData
    .map(item => {
      const countryInfo = countryCodeMap[item.country]
      if (!countryInfo) return null
      return {
        iso: countryInfo.iso,
        name: item.country,
        value: item.value,
        lat: countryInfo.lat,
        lng: countryInfo.lng,
      }
    })
    .filter((item): item is CountryData => item !== null)
}

