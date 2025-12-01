import { FlashcardItem } from './types';

export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const getWordsForLevel = async (level: string): Promise<FlashcardItem[]> => {
  const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const levelIndex = levels.indexOf(level);

  if (levelIndex === -1) {
    return [];
  }

  // Load the selected level's data
  const mainDataModule = await import(`./data/${level}.json`);
  let mainData: FlashcardItem[] = mainDataModule.default;

  // If it's not N5, we need to filter out words from lower levels
  if (levelIndex > 0) {
    const lowerLevels = levels.slice(0, levelIndex);
    
    const lowerLevelPromises = lowerLevels.map(lowerLevel => import(`./data/${lowerLevel}.json`));
    const lowerLevelModules = await Promise.all(lowerLevelPromises);

    const lowerLevelVocab = new Set<string>();
    lowerLevelModules.forEach(module => {
      const data: FlashcardItem[] = module.default;
      data.forEach(item => {
        if (item.Vocabulary) {
          lowerLevelVocab.add(item.Vocabulary);
        }
      });
    });

    mainData = mainData.filter(item => item.Vocabulary && !lowerLevelVocab.has(item.Vocabulary));
  }

  return mainData;
};
