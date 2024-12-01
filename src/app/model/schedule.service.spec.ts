import {ScheduleService} from './schedule.service';

describe('ScheduleService', () => {

  describe('inSameWeek', () => {
    it('should recognize dates in same week', () => {
      expect(ScheduleService.inSameMonth('21.09.2021', '22.09.2021')).toBeTrue();
      expect(ScheduleService.inSameMonth('20.09.2021', '23.09.2021')).toBeTrue();
      expect(ScheduleService.inSameMonth('31.12.2020', '01.01.2021')).toBeTrue();
    });

    it('should recognize dates not in same week', () => {
      expect(ScheduleService.inSameMonth('18.09.2021', '19.09.2021')).toBeFalse();
      expect(ScheduleService.inSameMonth('19.09.2021', '26.09.2021')).toBeFalse();
    });

    it('should recognize dates in same week, short', () => {
      expect(ScheduleService.inSameMonth('04.05.22', '05.05.22')).toBeTrue();
      expect(ScheduleService.inSameMonth('02.05.22', '07.05.22')).toBeTrue();
    });
  });

  describe('getDistributionScore', () => {
    it('should compare data against each other', () => {
      let testData = [
        [1, 5, 9, 13, 17, 22],
        [1, 11, 21],
        [6, 7, 13, 16, 20],
        [2, 10, 11, 12, 17, 22],
        [8, 10, 12, 14, 16],
        [1, 2, 3, 4, 20, 21, 22],
        [1, 19, 21]
      ];

      const scores = testData.map(d => ScheduleService.getDistributionScore(d, 22));
      console.log('scores:', scores);
      expect([...scores]).toEqual(scores.sort((a, b) => a - b));
    });
  });


  describe('isFilled', () => {
    const testGrid = [
      [undefined, true, false],
      [false, true, false],
      [false, false, false],
    ];

    it('should recognize filled grid', () => {
      expect(ScheduleService.isFilled([
        [undefined, true, false],
        [false, true, false],
        [false, false, false],
      ])).toBeFalse();
    });

    it('should recognize unfilled grid', () => {
      testGrid[0][0] = true;
      expect(ScheduleService.isFilled(testGrid)).toBeTrue();
    });
  });

  describe('isNear', () => {
    it('should recognize non-near dates', () => {
      expect(ScheduleService.isNearStr('03.11.22', '05.11.22')).toBeFalse();
    });

    it('should recognize near dates', () => {
      expect(ScheduleService.isNearStr('03.11.22', '03.11.22 (2)')).toBeTrue();
    });
  });
});
