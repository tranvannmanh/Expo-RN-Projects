import { StyleSheet } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';

const RemoteCamera = () => {
	const device = useCameraDevice('back');

	if (!device) return null;

	return <Camera style={StyleSheet.absoluteFill} device={device} isActive />;
};

export default RemoteCamera;
