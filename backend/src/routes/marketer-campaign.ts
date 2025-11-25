import express from 'express'
import { Campaign } from '../types/campaign'

const router = express.Router()

// 인메모리 캠페인 저장소
let campaigns: Campaign[] = []

// 캠페인 목록 조회
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: campaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      count: campaigns.length,
    })
  } catch (error) {
    console.error('캠페인 목록 조회 오류:', error)
    res.status(500).json({
      success: false,
      error: '캠페인 목록을 불러오는 중 오류가 발생했습니다.',
    })
  }
})

// 캠페인 생성
router.post('/', (req, res) => {
  try {
    const { name, contentIds, schedule } = req.body

    if (!name || !contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: '캠페인 이름과 콘텐츠 ID 목록이 필요합니다.',
      })
    }

    const campaign: Campaign = {
      id: `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      contentIds,
      schedule: schedule || {
        publishDate: new Date().toISOString().split('T')[0],
        platforms: [],
        timezone: 'Asia/Seoul',
      },
      status: 'planning',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    campaigns.push(campaign)

    res.json({
      success: true,
      data: campaign,
      message: '캠페인이 생성되었습니다.',
    })
  } catch (error) {
    console.error('캠페인 생성 오류:', error)
    res.status(500).json({
      success: false,
      error: '캠페인 생성 중 오류가 발생했습니다.',
    })
  }
})

// 캠페인 조회
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params
    const campaign = campaigns.find((c) => c.id === id)

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: '캠페인을 찾을 수 없습니다.',
      })
    }

    res.json({
      success: true,
      data: campaign,
    })
  } catch (error) {
    console.error('캠페인 조회 오류:', error)
    res.status(500).json({
      success: false,
      error: '캠페인을 불러오는 중 오류가 발생했습니다.',
    })
  }
})

// 캠페인 업데이트
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params
    const index = campaigns.findIndex((c) => c.id === id)

    if (index < 0) {
      return res.status(404).json({
        success: false,
        error: '캠페인을 찾을 수 없습니다.',
      })
    }

    const updatedCampaign: Campaign = {
      ...campaigns[index],
      ...req.body,
      id, // ID는 변경 불가
      updatedAt: new Date().toISOString(),
    }

    campaigns[index] = updatedCampaign

    res.json({
      success: true,
      data: updatedCampaign,
      message: '캠페인이 업데이트되었습니다.',
    })
  } catch (error) {
    console.error('캠페인 업데이트 오류:', error)
    res.status(500).json({
      success: false,
      error: '캠페인 업데이트 중 오류가 발생했습니다.',
    })
  }
})

// 캠페인 삭제
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params
    const index = campaigns.findIndex((c) => c.id === id)

    if (index < 0) {
      return res.status(404).json({
        success: false,
        error: '캠페인을 찾을 수 없습니다.',
      })
    }

    campaigns.splice(index, 1)

    res.json({
      success: true,
      message: '캠페인이 삭제되었습니다.',
    })
  } catch (error) {
    console.error('캠페인 삭제 오류:', error)
    res.status(500).json({
      success: false,
      error: '캠페인 삭제 중 오류가 발생했습니다.',
    })
  }
})

export default router

