import React, { useState, useCallback, useContext } from 'react';
import {
  View,
  ActivityIndicator,
  Linking,
  Platform,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Modal from 'react-native-modal';
import SendIntentAndroid from 'react-native-send-intent';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from 'styled-components/native';

import {
  Container,
  TitleContainer,
  Title,
  Cover,
  VideoLinkButton,
  NormalAnimeEpisodeContainer,
  NormalAnimeEpisodeText,
} from './styles';

import global from '~/global';

import { getEpisodeStreamingData } from '~/services/api';
import { userAgent } from '~/utils/userAgent';

interface AnimeComponentProps {
  title: string;
  cover?: string;
  videoId?: string;
  animeId?: string;
  isNewEpisode?: boolean;
  isNormalEpisode?: boolean;
  isAnime?: boolean;
  watched?: boolean;
}

const AnimeComponent: React.FC<AnimeComponentProps> = ({
  title,
  cover,
  videoId,
  animeId,
  isNewEpisode = false,
  isNormalEpisode = false,
  isAnime = false,
  watched = false,
  ...rest
}) => {
  const [episodeModalVisible, setEpisodeModalVisible] = useState(false);
  const [episodeModalLoading, setEpisodeModalLoading] = useState(false);
  const [watchedState, setWatchedState] = useState(watched);
  const [episodeModalData, setEpisodeModalData] = useState<AnimeStreamingData>(
    {} as AnimeStreamingData,
  );

  const theme = useContext(ThemeContext);
  const navigation = useNavigation();

  const onEpisodeClick = useCallback(async () => {
    if (videoId) {
      setEpisodeModalLoading(true);
      setEpisodeModalVisible(true);
      const res = await getEpisodeStreamingData(videoId);
      setEpisodeModalLoading(false);

      setEpisodeModalData(res || ({} as AnimeStreamingData));
    }
  }, []);

  const openLink = useCallback(async (link: string) => {
    if (Platform.OS === 'android')
      await SendIntentAndroid.openAppWithData(
        (undefined as unknown) as string,
        link,
        'video/*',
      );
    else {
      const supported = await Linking.canOpenURL(link);

      if (supported) await Linking.openURL(link);
    }

    const loadedHistory = await AsyncStorage.getItem(
      global.storageKeys.history,
    );

    const parsedLoadedHistory = JSON.parse(loadedHistory || '[]');

    if (parsedLoadedHistory.indexOf(videoId) === -1)
      await AsyncStorage.setItem(
        global.storageKeys.history,
        JSON.stringify([...parsedLoadedHistory, videoId]),
      );

    setWatchedState(true);
  }, []);

  const onAnimeClick = useCallback(async () => {
    navigation.navigate('Anime', { title, cover, animeId });
  }, []);

  return (
    <>
      {!isNormalEpisode ? (
        <Container
          {...rest}
          onPress={() => {
            if (isNewEpisode || isNormalEpisode) onEpisodeClick();
            if (isAnime) onAnimeClick();
          }}>
          <Cover
            source={{
              uri: `${global.imagesBaseUrl}/${cover}`,
              headers: {
                'user-agent': userAgent,
              },
            }}
            resizeMode="cover"
          />
          <TitleContainer>
            <Title numberOfLines={2}>{title}</Title>
          </TitleContainer>
        </Container>
      ) : (
        <NormalAnimeEpisodeContainer
          {...rest}
          onPress={() => {
            if (isNewEpisode || isNormalEpisode) onEpisodeClick();
            if (isAnime) onAnimeClick();
          }}>
          {watchedState && (
            <Icon
              name="eye"
              style={{
                position: 'absolute',
                left: -5,
                top: -6,
              }}
              size={20}
              color={theme.textColor}
            />
          )}
          <NormalAnimeEpisodeText>{title}</NormalAnimeEpisodeText>
        </NormalAnimeEpisodeContainer>
      )}
      <Modal
        style={{ flex: 1, alignItems: 'center' }}
        deviceHeight={Dimensions.get('screen').height}
        deviceWidth={Dimensions.get('screen').width}
        needsOffscreenAlphaCompositing
        useNativeDriver
        isVisible={episodeModalVisible}
        onBackdropPress={() => setEpisodeModalVisible(false)}
        onBackButtonPress={() => setEpisodeModalVisible(false)}>
        <View
          style={{
            flex: 1,
            padding: 20,
            maxHeight: '50%',
            width: 300,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.secundaryColor,
            borderRadius: 5,
          }}>
          {episodeModalLoading ? (
            <ActivityIndicator color={theme.textColor} size={75} />
          ) : (
            <>
              {!isNormalEpisode ? (
                <TouchableOpacity
                  onPress={() => {
                    setEpisodeModalVisible(false);
                    onAnimeClick();
                  }}
                  style={{ alignSelf: 'center' }}>
                  <Title
                    style={{
                      fontSize: 20,
                      marginBottom: 20,
                      textAlign: 'center',
                      lineHeight: 26,
                    }}>
                    {title}
                    {'   '}
                    <Icon
                      name="external-link"
                      color={theme.textColor}
                      size={20}
                    />
                  </Title>
                </TouchableOpacity>
              ) : (
                <Title
                  style={{
                    fontSize: 20,
                    marginBottom: 20,
                    textAlign: 'center',
                  }}>
                  {title}
                </Title>
              )}
              {!!episodeModalData.location && (
                <VideoLinkButton
                  onPress={() => openLink(episodeModalData.location)}>
                  <Title style={{ fontSize: 14 }}>Qualidade 1</Title>
                </VideoLinkButton>
              )}
              {!!episodeModalData.locationsd && (
                <VideoLinkButton
                  onPress={() => openLink(episodeModalData.locationsd)}>
                  <Title style={{ fontSize: 14 }}>Qualidade 2 (HD)</Title>
                </VideoLinkButton>
              )}
              {!!episodeModalData.locationhd && (
                <VideoLinkButton
                  onPress={() => openLink(episodeModalData.locationhd)}>
                  <Title style={{ fontSize: 14 }}>Qualidade 3 (HD 2)</Title>
                </VideoLinkButton>
              )}
              {/* <TouchableOpacity
                style={{ position: 'absolute', bottom: 15, right: 15 }}>
                <Icon name="external-link" color={theme.textColor} size={30} />
              </TouchableOpacity> */}
            </>
          )}
        </View>
      </Modal>
    </>
  );
};

export default AnimeComponent;
