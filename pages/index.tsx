import React, { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import Layout from "../components/Layout";
import Post, { PostProps } from "../components/Post";
import prisma from '../lib/prisma'
import {io} from "socket.io-client";

export const getServerSideProps: GetServerSideProps = async () => {
  const feed = await prisma.post.findMany({
    where: {
      published: true,
    },
    include: {
      author: {
        select: {
          name: true,
        },
      },
    },
  });
  return {
    props: { feed },
  };
};

type Props = {
  feed: PostProps[];
};

const Blog: React.FC<Props> = (props) => {

  const [connected, setConnected] = useState(false)
  const [feed, setFeed] = useState(props.feed)
  


  useEffect((): any => {


    // connect to socket server
    const socket = io({host: process.env.NEXTAUTH_URL, path: "/api/socketio"});

    // log socket connection
    socket.on("connect", () => {
      console.log("SOCKET CONNECTED!", socket.id);
      setConnected(true);
    });

    // update chat on new message dispatched
    socket.on("newpost", (message: PostProps) => {
      feed.push(message);
      setFeed([...feed]);
    });

    // socket disconnet onUnmount if exists
    if (socket) return () => socket.disconnect();
  }, []);



  
  return (
    <Layout>
      <div className="page">
        <h1>Public Feed</h1>
        <main>
          {feed.map((post) => (
            <div key={post.id} className="post">
              <Post post={post} />
            </div>
          ))}
        </main>
      </div>
      <style jsx>{`
        .post {
          background: white;
          transition: box-shadow 0.1s ease-in;
        }

        .post:hover {
          box-shadow: 1px 1px 3px #aaa;
        }

        .post + .post {
          margin-top: 2rem;
        }
      `}</style>
    </Layout>
  );
};

export default Blog;
