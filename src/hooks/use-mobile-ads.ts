import { useEffect, useRef } from 'react';
import mobileAds, {
	AdsConsent,
	AgeRestrictedTreatment,
	MaxAdContentRating,
} from 'react-native-google-mobile-ads';

mobileAds().setRequestConfiguration({
	maxAdContentRating: MaxAdContentRating.PG,
	ageRestrictedTreatment: AgeRestrictedTreatment.CHILD,
	testDeviceIdentifiers: ['EMULATOR'],
});

export function useMobileAds() {
	const isMobileAdsStartCalledRef = useRef(false);

	async function startGoogleMobileAdsSDK() {
		const { canRequestAds } = await AdsConsent.getConsentInfo();
		if (!canRequestAds || isMobileAdsStartCalledRef.current) {
			return;
		}
		isMobileAdsStartCalledRef.current = true;
		// (Optional, iOS) Handle Apple's App Tracking Transparency manually.
		const gdprApplies = await AdsConsent.getGdprApplies();
		const hasConsentForPurposeOne =
			gdprApplies && (await AdsConsent.getPurposeConsents()).startsWith('1');
		if (!gdprApplies || hasConsentForPurposeOne) {
			// Request ATT...
		}
		// Initialize the Google Mobile Ads SDK.
		await mobileAds().initialize();
		// Request an ad...
	}
	useEffect(() => {
		// Request consent information and load/present a consent form if necessary.
		AdsConsent.gatherConsent()
			.then(startGoogleMobileAdsSDK)
			.catch((error) => console.error('Consent gathering failed:', error));
		// This sample attempts to load ads using consent obtained in the previous session.
		// We intentionally use .then() chaining (instead of await) to ensure parallel execution.
		AdsConsent.requestInfoUpdate()
			.then(startGoogleMobileAdsSDK)
			.catch((error) => console.error('Consent gathering failed:', error));
	}, []);
}
