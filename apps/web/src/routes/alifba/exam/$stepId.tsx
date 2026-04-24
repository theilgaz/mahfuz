/**
 * Adım sınavı -- /alifba/exam/:stepId
 * QAIDA_TOPICS exam config'inden soru üretir, ExamRunner ile gösterir.
 */

import { useMemo, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { getTopicByOrder } from "~/lib/qaida-topics";
import { buildExam } from "~/lib/exam-builder";
import { ExamRunner } from "~/components/qaida/ExamRunner";
import { useQaidaStore } from "~/stores/qaida.store";

export const Route = createFileRoute("/alifba/exam/$stepId")({
  component: StepExamPage,
});

function StepExamPage() {
  const { stepId } = Route.useParams();
  const { t } = useTranslation();
  const stepNum = Number(stepId);
  const topic = getTopicByOrder(stepNum);
  const completeStep = useQaidaStore((s) => s.completeStep);

  const questions = useMemo(() => {
    if (!topic || topic.examConfig.generators.length === 0) return [];
    return buildExam(topic.examConfig);
  }, [stepId]); // eslint-disable-line react-hooks/exhaustive-deps

  const titleText =
    (t.hub as unknown as Record<string, string>)?.[topic?.titleKey ?? ""] ??
    topic?.titleKey ??
    "";

  const handleComplete = useCallback(
    (_score: number, _total: number, passed: boolean) => {
      if (passed && topic) {
        completeStep(stepNum);
      }
    },
    [stepNum, topic, completeStep],
  );

  if (!topic || questions.length === 0) {
    return (
      <div className="mu-roadmap" style={{ textAlign: "center", paddingTop: 40 }}>
        <p style={{ color: "var(--mu-muted)" }}>
          {"Bu ad\u0131m i\u00E7in s\u0131nav hen\u00FCz haz\u0131r de\u011Fil."}
        </p>
      </div>
    );
  }

  return (
    <ExamRunner
      key={stepId}
      questions={questions}
      passThreshold={topic.examConfig.passThreshold}
      onComplete={handleComplete}
      title={`${stepNum}. Ad\u0131m: ${titleText}`}
      backLink={`/alifba/step/${stepNum}`}
    />
  );
}
