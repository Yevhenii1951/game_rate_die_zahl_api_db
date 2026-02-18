import { describe, expect, it } from 'vitest'
import { addTwoNumbers } from './addTwoNumbers.test copy'

describe('addTwoNumbers', () => {
	it('should add two positive numbers', () => {
		expect(addTwoNumbers(2, 3)).toBe(5)
	})

	it('should add two negative numbers', () => {
		expect(addTwoNumbers(-2, -3)).toBe(-5)
	})

	it('should add a positive and negative number', () => {
		expect(addTwoNumbers(5, -3)).toBe(2)
	})

	it('should return zero when adding zero to zero', () => {
		expect(addTwoNumbers(0, 0)).toBe(0)
	})

	it('should handle decimal numbers', () => {
		expect(addTwoNumbers(1.5, 2.5)).toBe(4)
	})
})
