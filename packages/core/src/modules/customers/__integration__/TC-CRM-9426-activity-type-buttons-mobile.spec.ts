import { expect, test } from '@playwright/test'
import { login } from '@open-mercato/core/helpers/integration/auth'
import { getAuthToken } from '@open-mercato/core/helpers/integration/api'
import {
  createCompanyFixture,
  createDealFixture,
  deleteEntityIfExists,
} from '@open-mercato/core/helpers/integration/crmFixtures'

/**
 * TC-CRM-9426: the activity-type buttons in the deal activity composer fit their content at
 * phone width in Polish (#9426, found in the QA run on #7690).
 *
 * `ActivityTypeSelector` used a fixed five-column grid, so at 390 px every button got about
 * 46 px while its icon and Polish label needed 56–68 px, and the content spilled over the
 * neighbouring buttons. jsdom has no layout engine, so this can only be pinned in a real browser.
 */
const POLISH_TYPE_LABELS = ['Telefon', 'E-mail', 'Spotkanie', 'Notatka', 'Zadanie']

test.describe('TC-CRM-9426: activity-type buttons fit at phone width (#9426)', () => {
  test('every type button contains its content and no two buttons overlap at 390px in Polish', async ({
    page,
    context,
    request,
  }) => {
    const token = await getAuthToken(request, 'admin')
    const stamp = Date.now()
    let companyId: string | null = null
    let dealId: string | null = null

    try {
      companyId = await createCompanyFixture(request, token, `QA TC-CRM-9426 Co ${stamp}`)
      dealId = await createDealFixture(request, token, {
        title: `QA TC-CRM-9426 Deal ${stamp}`,
        companyIds: [companyId],
      })

      await page.setViewportSize({ width: 390, height: 844 })
      await login(page, 'admin')
      await context.addCookies([
        { name: 'locale', value: 'pl', url: process.env.BASE_URL || 'http://localhost:3000' },
      ])
      await page.goto(`/backend/customers/deals/${dealId}`)

      const buttons = POLISH_TYPE_LABELS.map((label) =>
        page.locator('button[aria-pressed]').filter({ hasText: label }).first(),
      )
      for (const button of buttons) {
        await expect(button).toBeVisible()
      }

      const boxes: Array<{ x: number; y: number; width: number; height: number }> = []
      for (const [index, button] of buttons.entries()) {
        const size = await button.evaluate((node) => ({
          scrollWidth: node.scrollWidth,
          clientWidth: node.clientWidth,
        }))
        expect(
          size.scrollWidth,
          `"${POLISH_TYPE_LABELS[index]}" content must fit inside its button`,
        ).toBeLessThanOrEqual(size.clientWidth)
        const box = await button.boundingBox()
        expect(box, `"${POLISH_TYPE_LABELS[index]}" must be laid out`).not.toBeNull()
        boxes.push(box!)
      }

      for (let first = 0; first < boxes.length; first += 1) {
        for (let second = first + 1; second < boxes.length; second += 1) {
          const left = boxes[first]
          const right = boxes[second]
          const overlaps =
            left.x < right.x + right.width &&
            right.x < left.x + left.width &&
            left.y < right.y + right.height &&
            right.y < left.y + left.height
          expect(
            overlaps,
            `"${POLISH_TYPE_LABELS[first]}" and "${POLISH_TYPE_LABELS[second]}" must not overlap`,
          ).toBe(false)
        }
      }
    } finally {
      await deleteEntityIfExists(request, token, '/api/customers/deals', dealId)
      await deleteEntityIfExists(request, token, '/api/customers/companies', companyId)
    }
  })
})
