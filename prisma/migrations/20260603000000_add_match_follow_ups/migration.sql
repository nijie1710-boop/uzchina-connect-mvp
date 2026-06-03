CREATE TABLE "MatchFollowUp" (
    "id" TEXT NOT NULL,
    "matchRequestId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "nextStep" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchFollowUp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MatchFollowUp_matchRequestId_idx" ON "MatchFollowUp"("matchRequestId");
CREATE INDEX "MatchFollowUp_authorId_idx" ON "MatchFollowUp"("authorId");
CREATE INDEX "MatchFollowUp_createdAt_idx" ON "MatchFollowUp"("createdAt");

ALTER TABLE "MatchFollowUp" ADD CONSTRAINT "MatchFollowUp_matchRequestId_fkey" FOREIGN KEY ("matchRequestId") REFERENCES "MatchRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchFollowUp" ADD CONSTRAINT "MatchFollowUp_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
