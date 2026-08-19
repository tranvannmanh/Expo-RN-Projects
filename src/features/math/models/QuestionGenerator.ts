import { randomInt, shuffle } from '@/utils';
import { Question } from '../types';

export class QuestionGenerator {
	generate(difficulty: number): Question {
		switch (difficulty) {
			case 1:
			default:
				return this.generateDifficulty1();
		}
	}

	private generateDifficulty1(): Question {
		const useAddition = Math.random() < 0.5;

		let a = randomInt(1, 20);
		let b = randomInt(1, 20);

		let answer: number;
		let expression: string;

		if (useAddition) {
			answer = a + b;
			expression = `${a} + ${b}`;
		} else {
			// Đảm bảo kết quả không âm
			if (a < b) {
				[a, b] = [b, a];
			}

			answer = a - b;
			expression = `${a} - ${b}`;
		}

		const options = this.generateOptions(answer);

		return {
			expression,
			answer,
			options,
			difficulty: 1,
		};
	}

	private generateOptions(answer: number): number[] {
		const options = new Set<number>();

		options.add(answer);

		while (options.size < 4) {
			const offset = randomInt(-5, 5);

			if (offset === 0) {
				continue;
			}

			const option = answer + offset;

			if (option >= 0) {
				options.add(option);
			}
		}

		return shuffle([...options]);
	}
}
