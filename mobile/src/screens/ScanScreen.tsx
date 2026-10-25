import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  TextInput, 
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, Barcode, ArrowLeft, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { mobileApi } from '../api/client';

interface ScanScreenProps {
  onBack: () => void;
  onScanComplete: (scanData: any, productData: any) => void;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({ onBack, onScanComplete }) => {
  const [mode, setMode] = useState<'camera' | 'barcode'>('camera');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [hintName, setHintName] = useState('');

  const pickImage = async (useCamera: boolean = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera access is required to take packaging photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.9,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Photo library access is required to upload label pictures.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.9,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to select image');
    }
  };

  const handleProcessOCR = async () => {
    if (!selectedImage) {
      Alert.alert('Select Photo', 'Please take or choose a food packaging photo first.');
      return;
    }

    setLoading(true);
    setStatusText('Enhancing packaging contrast...');

    try {
      const formData = new FormData();
      const filename = selectedImage.split('/').pop() || 'label.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      // @ts-ignore
      formData.append('file', {
        uri: Platform.OS === 'ios' ? selectedImage.replace('file://', '') : selectedImage,
        name: filename,
        type: type,
      });

      if (hintName.trim()) {
        formData.append('product_name_hint', hintName.trim());
      }

      setStatusText('Running RapidOCR deep learning inference...');
      const response = await mobileApi.uploadScan(formData);

      if (response.status === 'success' && response.scan) {
        onScanComplete(response.scan, response.product);
      } else {
        throw new Error('OCR inference returned incomplete response');
      }
    } catch (err: any) {
      Alert.alert(
        'Scan Needs Review',
        err.message || 'Unable to extract clear text. Ensure label is well-lit and in focus.'
      );
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  const handleBarcodeLookup = async () => {
    const code = barcodeInput.trim();
    if (!code) {
      Alert.alert('Barcode Required', 'Please enter a numeric barcode.');
      return;
    }

    setLoading(true);
    setStatusText('Querying Open Food Facts database...');

    try {
      const res = await mobileApi.lookupBarcode(code);
      if (res && res.product) {
        Alert.alert('Product Found', `Retrieved ${res.product.name} (${res.product.brand})`);
        onScanComplete({ extracted_product_name: res.product.name }, res.product);
      }
    } catch (err: any) {
      Alert.alert(
        'Product Not Found',
        `No product found for barcode '${code}'. You can take a label photo to create a verified record.`
      );
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header with Back */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Food Label Scanner</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Mode Toggle Tabs */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleTab, mode === 'camera' && styles.activeToggleTab]}
          onPress={() => setMode('camera')}
        >
          <Camera size={16} color={mode === 'camera' ? colors.forestGreen : colors.secondaryText} />
          <Text style={[styles.toggleText, mode === 'camera' && styles.activeToggleText]}>
            Photo OCR
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleTab, mode === 'barcode' && styles.activeToggleTab]}
          onPress={() => setMode('barcode')}
        >
          <Barcode size={16} color={mode === 'barcode' ? colors.forestGreen : colors.secondaryText} />
          <Text style={[styles.toggleText, mode === 'barcode' && styles.activeToggleText]}>
            Barcode Scan
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'camera' ? (
        <View style={styles.cameraSection}>
          {/* Viewfinder Preview Box */}
          <View style={styles.previewBox}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <View style={styles.emptyPreview}>
                <Camera size={48} color={colors.secondaryText} />
                <Text style={styles.previewInstructions}>
                  Align Nutrition Facts or Ingredients list inside the frame
                </Text>
                <Text style={styles.previewSub}>
                  Ensure good lighting &bull; Avoid reflections
                </Text>
              </View>
            )}

            {/* Viewfinder Frame Overlay Corners */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>

          {/* Hint input */}
          <TextInput
            placeholder="Product name or brand hint (optional)"
            placeholderTextColor={colors.secondaryText}
            value={hintName}
            onChangeText={setHintName}
            style={styles.hintInput}
          />

          {/* Action buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnSecondary]} 
              onPress={() => pickImage(false)}
              disabled={loading}
            >
              <ImageIcon size={18} color={colors.primaryText} />
              <Text style={styles.btnSecondaryText}>Photo Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.btnSecondary]} 
              onPress={() => pickImage(true)}
              disabled={loading}
            >
              <Camera size={18} color={colors.primaryText} />
              <Text style={styles.btnSecondaryText}>Take Photo</Text>
            </TouchableOpacity>
          </View>

          {selectedImage && (
            <TouchableOpacity 
              style={[styles.btn, styles.btnPrimary]}
              onPress={handleProcessOCR}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <RefreshCw size={18} color="#FFFFFF" />
              )}
              <Text style={styles.btnPrimaryText}>
                {loading ? 'Processing Deep Learning OCR...' : 'Run LabelLens AI OCR'}
              </Text>
            </TouchableOpacity>
          )}

          {loading && (
            <View style={styles.statusBox}>
              <ActivityIndicator color={colors.forestGreen} size="small" />
              <Text style={styles.statusLabel}>{statusText}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.barcodeSection}>
          <View style={styles.barcodeCard}>
            <Barcode size={44} color={colors.tangerine} style={{ marginBottom: 12 }} />
            <Text style={styles.barcodeTitle}>Enter Product Barcode</Text>
            <Text style={styles.barcodeSub}>
              Queries Open Food Facts for instant verified nutrition, allergens, and ingredients.
            </Text>

            <TextInput
              placeholder="e.g. 3017620422003 (Nutella)"
              placeholderTextColor={colors.secondaryText}
              value={barcodeInput}
              onChangeText={setBarcodeInput}
              keyboardType="numeric"
              style={styles.barcodeInput}
            />

            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, { width: '100%' }]}
              onPress={handleBarcodeLookup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Barcode size={18} color="#FFFFFF" />
              )}
              <Text style={styles.btnPrimaryText}>
                {loading ? 'Looking up database...' : 'Lookup Barcode'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmCream,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryText,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  activeToggleTab: {
    backgroundColor: colors.paleMint,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  activeToggleText: {
    color: colors.forestGreen,
    fontWeight: '700',
  },
  cameraSection: {},
  previewBox: {
    width: '100%',
    height: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  emptyPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  previewInstructions: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
    marginTop: 14,
  },
  previewSub: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 6,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.forestGreen,
  },
  cornerTL: { top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 16, left: 16, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 16, right: 16, borderBottomWidth: 3, borderRightWidth: 3 },
  hintInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    color: colors.primaryText,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
  },
  btnPrimary: {
    backgroundColor: colors.forestGreen,
    marginTop: 6,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 10,
  },
  statusLabel: {
    fontSize: 12,
    color: colors.forestGreen,
    fontWeight: '600',
  },
  barcodeSection: {},
  barcodeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  barcodeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryText,
    marginBottom: 6,
  },
  barcodeSub: {
    fontSize: 12,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  barcodeInput: {
    width: '100%',
    backgroundColor: colors.cardSub,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 16,
  }
});
