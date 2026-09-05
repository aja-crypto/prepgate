// Map API PYQ documents to frontend progress shape
export function mapPyqFromApi(q, existing) {
  const mongoId = q._id || q.mongoId;
  const prev = existing?.find((p) => p.mongoId === mongoId || p.id === mongoId);

  return {
    id: prev?.id || mongoId,
    mongoId,
    title: q.title,
    subject: q.subject?.name || q.subject || 'Unknown',
    subjectId: q.subject?._id || q.subject,
    topic: q.topic?.name || q.topic || '',
    topicId: q.topic?._id || q.topic,
    year: q.year,
    difficulty: q.difficulty,
    marks: q.marks,
    questionType: q.questionType || 'MCQ',
    questionText: q.questionText || '',
    options: q.options || [],
    explanation: q.explanation || '',
    imageUrl: q.imageUrl || '',
    tags: q.tags || [],
    source: q.source || '',
    solved: q.isSolved ?? prev?.solved ?? false,
    bookmarked: q.isBookmarked ?? prev?.bookmarked ?? false,
    revisionNeeded: q.revisionNeeded ?? prev?.revisionNeeded ?? false,
    markedDifficult: q.markedDifficult ?? prev?.markedDifficult ?? false,
    lastStatus: q.lastStatus ?? prev?.lastStatus ?? null,
    questionStats: q.questionStats || null,
  };
}

export function mergePyqLists(apiPyqs, localPyqs) {
  const localOnly = localPyqs.filter((p) => !p.mongoId);
  const mapped = apiPyqs.map((q) => mapPyqFromApi(q, localPyqs));
  return [...mapped, ...localOnly];
}
