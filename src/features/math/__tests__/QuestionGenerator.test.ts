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

describe('difficulty', () => {
	it('should generate difficulty 1 question', () => {
		const generator = new QuestionGenerator();

		const question = generator.generate(1);

		expect(question.difficulty).toBe(1);
	});

	it('should generate difficulty 2 question', () => {
		const generator = new QuestionGenerator();

		const question = generator.generate(2);

		expect(question.difficulty).toBe(2);
	});

	it('should generate difficulty 3 question', () => {
		const generator = new QuestionGenerator();

		const question = generator.generate(3);

		expect(question.difficulty).toBe(3);
	});

	it('should generate difficulty 4 question', () => {
		const generator = new QuestionGenerator();

		const question = generator.generate(4);

		expect(question.difficulty).toBe(4);
	});
});
