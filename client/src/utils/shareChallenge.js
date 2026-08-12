export const getChallengeUrl = (challengeCode) => {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "";

  return `${origin}/challenge/${challengeCode}`;
};

export const getChallengeInvitation = (challengeCode) => {
  const challengeUrl = getChallengeUrl(challengeCode);
  const text = `I challenge you to beat my quiz score! \uD83C\uDFAF\n\nChallenge Code: ${challengeCode}`;

  return {
    title: "Quiz Challenge",
    text,
    url: challengeUrl,
    clipboardText: `${text}\n\n${challengeUrl}`,
  };
};

export const shareChallenge = async (challengeCode) => {
  const invitation = getChallengeInvitation(challengeCode);

  if (navigator.share) {
    try {
      await navigator.share({
        title: invitation.title,
        text: invitation.text,
        url: invitation.url,
      });

      return { status: "shared" };
    } catch (error) {
      if (error?.name === "AbortError") {
        return { status: "cancelled" };
      }
    }
  }

  await navigator.clipboard.writeText(invitation.clipboardText);
  return { status: "copied" };
};
