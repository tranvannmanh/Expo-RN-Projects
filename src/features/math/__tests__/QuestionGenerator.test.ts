import { describe, expect, it } from '@jest/globals';
import { QuestionGenerator } from '../models/QuestionGenerator';

describe('QuestionGenerator', () => {
	const generator = new QuestionGenerator();

	it('should generate a valid question', () => {
		const question = generator.generate(1);

		expect(question.expression).toBeTruthy();
		expect(typeof question.answer).toBe('number');
		expect(question.options).toHaveLength(4);
	});

	it('should contain the correct answer in options', () => {
		for (let i = 0; i < 100; i++) {
			const question = generator.generate(1);

			expect(question.options).toContain(question.answer);
		}
	});

	it('should not contain duplicate options', () => {
		for (let i = 0; i < 100; i++) {
			const question = generator.generate(1);

			const uniqueOptions = new Set(question.options);

			expect(uniqueOptions.size).toBe(4);
		}
	});
});
