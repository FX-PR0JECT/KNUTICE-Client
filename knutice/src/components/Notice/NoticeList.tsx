'use client';

import { useInfiniteQuery } from 'react-query';
import { useSearchParams } from 'next/navigation';
import { forwardRef, useCallback, useRef, Fragment } from 'react';

import {
  CardWrapper,
  LinkItem,
  CardItem,
  Notice,
  Title,
  Department,
  Classification,
  RegistrationDate,
  NoticeCardList,
} from '@/styles/Notice/NoticeList';
import { API_URL } from '@/services/api';
import { departmentTag } from '@/utils/departmentTag';
import { ContentImage, SkeletonCard, Empty } from '@/components';

interface INotice {
  departName: string;
  nttId: number;
  registrationDate: string;
  title: string;
  contentURL: string;
  contentImage: string;
  boardNumber: number;
}

interface INoticeCard {
  device: TDevice;
  notice: INotice;
  selectedTab: string;
}

const NoticeList = ({ device }: { device: TDevice }) => {
  const params = useSearchParams();
  const selectedTab = params.get('tab') || 'general';
  const observer = useRef<IntersectionObserver | null>(null);

  const skeletonCount = Array.from({ length: 18 }).fill(0);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isError, isLoading } =
    useInfiniteQuery(
      ['notices', selectedTab],
      async ({ pageParam }) => {
        const url = pageParam
          ? `${API_URL}/${selectedTab}News?startBoardNumber=${pageParam}&size=18`
          : `${API_URL}/${selectedTab}News?size=18`;

        const response = await fetch(url, { cache: 'no-store' });
        const result = await response.json();

        return result.data;
      },
      {
        getNextPageParam: (lastPage) => {
          if (lastPage.length < 18) return undefined;
          return lastPage[lastPage.length - 1].boardNumber;
        },
        retry: 0,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
      }
    );

  const lastNoticeElementRef = useCallback(
    (node: HTMLLIElement) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
      });

      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, fetchNextPage, hasNextPage]
  );

  if (!data || isLoading) {
    return (
      <NoticeCardList $device={device}>
        {skeletonCount.map((_, index) => (
          <SkeletonCard device={device} key={index} />
        ))}
      </NoticeCardList>
    );
  }

  if (data.pages[0].length === 0) return <Empty device={device} />;

  if (isError) return <></>;

  return (
    <NoticeCardList $device={device}>
      {data.pages.map((notices, i) => (
        <Fragment key={i}>
          {notices.map((notice: INotice, index: number) => {
            if (notices.length === index + 1) {
              return (
                <NoticeCard
                  device={device}
                  ref={lastNoticeElementRef}
                  key={notice.nttId}
                  selectedTab={selectedTab}
                  notice={notice}
                />
              );
            } else {
              return (
                <NoticeCard
                  device={device}
                  key={notice.nttId}
                  selectedTab={selectedTab}
                  notice={notice}
                />
              );
            }
          })}
        </Fragment>
      ))}
    </NoticeCardList>
  );
};

const NoticeCard = forwardRef<HTMLLIElement, INoticeCard>(
  ({ notice, selectedTab, device }, ref) => {
    return (
      <CardWrapper $device={device} ref={ref}>
        <LinkItem href={notice.contentURL}>
          <CardItem>
            <ContentImage device={device} imageURL={notice.contentImage} />
            <Notice>
              <Title $device={device}>{notice.title}</Title>
              <Department>{notice.departName}</Department>
              <Classification>{departmentTag(selectedTab)}</Classification>
              <RegistrationDate>{notice.registrationDate}</RegistrationDate>
            </Notice>
          </CardItem>
        </LinkItem>
      </CardWrapper>
    );
  }
);

export default NoticeList;
